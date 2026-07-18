const db = require('../../db/index');
const { requireAuth } = require('../_auth');
const { generateHeartbeatSecret, HEARTBEAT_FRESHNESS_SECONDS } = require('../_media_nodes');
const { logPlatformAudit, getIp } = require('../_audit');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Media node information is restricted to platform_admin users only.
    // This data includes infrastructure details that should not be exposed
    // to regular operators or org_admins.
    const auth = await requireAuth(req, res, { roles: ['platform_admin'] });
    if (!auth) return;

    try {
      const { rows } = await db.queryAsPlatformAdmin(`
        SELECT
          n.id, n.region, n.hostname, n.public_hls_url, n.capacity,
          n.last_heartbeat_at,
          count(c.id)::int AS current_cameras,
          COALESCE(n.last_heartbeat_at > now() - interval '${HEARTBEAT_FRESHNESS_SECONDS} seconds', false) AS online
        FROM media_nodes n
        LEFT JOIN cameras c ON c.media_node_id = n.id
        GROUP BY n.id
        ORDER BY n.region, n.hostname
      `);
      res.status(200).json({ success: true, count: rows.length, nodes: rows });
    } catch (err) {
      console.error('GET /api/media-nodes error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const auth = await requireAuth(req, res, { roles: ['platform_admin'] });
    if (!auth) return;

    const { region, hostname, public_hls_url: publicHlsUrl, capacity } = req.body || {};
    if (!region || !hostname || !publicHlsUrl) {
      res.status(400).json({ success: false, error: 'region, hostname, and public_hls_url are required' });
      return;
    }

    try {
      const heartbeatSecret = generateHeartbeatSecret();
      const inserted = await db.query(
        `INSERT INTO media_nodes (region, hostname, public_hls_url, capacity, heartbeat_secret)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, region, hostname, public_hls_url, capacity`,
        [region, hostname, publicHlsUrl, capacity || 50, heartbeatSecret],
      );
      // heartbeat_secret is only ever returned once, at creation time --
      // it's not retrievable afterwards (same principle as an API key).
      await logPlatformAudit({
        userId: auth.userId,
        action: 'media_node.create',
        resourceType: 'media_node',
        resourceId: inserted.rows[0].id,
        metadata: { region, hostname },
        ipAddress: getIp(req),
      });
      res.status(201).json({ success: true, node: inserted.rows[0], heartbeat_secret: heartbeatSecret });
    } catch (err) {
      console.error('POST /api/media-nodes error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
