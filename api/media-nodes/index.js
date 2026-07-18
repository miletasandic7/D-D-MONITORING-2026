const db = require('../../db/index');
const { requireAuth } = require('../_auth');
const { generateHeartbeatSecret, HEARTBEAT_FRESHNESS_SECONDS } = require('../_media_nodes');
const { logPlatformAudit, getIp } = require('../_audit');

module.exports = async (req, res) => {
  const { nodeId } = req.query;

  // Handle /api/media-nodes/:nodeId/heartbeat (POST - node heartbeat)
  if (nodeId !== undefined) {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method Not Allowed' });
      return;
    }

    if (!db.hasDatabase) {
      res.status(503).json({ success: false, error: 'Database not configured. Set DATABASE_URL environment variable.' });
      return;
    }

    const { heartbeat_secret: heartbeatSecret } = req.body || {};

    if (!heartbeatSecret) {
      res.status(401).json({ success: false, error: 'heartbeat_secret is required' });
      return;
    }

    try {
      const result = await db.query(
        `UPDATE media_nodes SET last_heartbeat_at = now()
         WHERE id = $1 AND heartbeat_secret = $2
         RETURNING id, region, hostname`,
        [nodeId, heartbeatSecret],
      );
      if (result.rows.length === 0) {
        res.status(401).json({ success: false, error: 'Invalid node id or heartbeat_secret' });
        return;
      }
      res.status(200).json({ success: true, node_id: nodeId, acknowledged_at: new Date().toISOString() });
    } catch (err) {
      console.error('POST /api/media-nodes/:nodeId/heartbeat error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  // Handle /api/media-nodes (GET/POST - list/create nodes)
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res);
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
