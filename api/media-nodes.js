const db = require('../db/index');
const { requireAuth } = require('./_auth');
const { generateHeartbeatSecret, HEARTBEAT_FRESHNESS_SECONDS } = require('./_media_nodes');
const { logPlatformAudit, getIp } = require('./_audit');

// GET /api/media-nodes - list all media nodes (platform_admin only)
async function handleGetMediaNodes(req, res) {
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
}

// POST /api/media-nodes - create media node
async function handlePostMediaNodes(req, res) {
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
}

// POST /api/media-nodes/heartbeat - receive heartbeat from media node
async function handlePostHeartbeat(req, res) {
  const { nodeId } = req.query || req.body || {};
  const { heartbeat_secret: providedSecret, status, load, region } = req.body || {};

  if (!nodeId || !providedSecret) {
    res.status(400).json({ success: false, error: 'nodeId and heartbeat_secret are required' });
    return;
  }

  try {
    const node = await db.query(
      `SELECT id, heartbeat_secret FROM media_nodes WHERE id = $1`,
      [nodeId],
    );

    if (node.rows.length === 0 || node.rows[0].heartbeat_secret !== providedSecret) {
      res.status(401).json({ success: false, error: 'Invalid node ID or heartbeat secret' });
      return;
    }

    await db.query(
      `UPDATE media_nodes
       SET last_heartbeat_at = now(), status = $1, load = $2, region = COALESCE($3, region)
       WHERE id = $4`,
      [status || 'online', load || 0, region, nodeId],
    );

    res.status(200).json({ success: true, synced: true });
  } catch (err) {
    console.error('POST /api/media-nodes/heartbeat error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = async (req, res) => {
  const url = req.url;

  if (req.method === 'GET') {
    return handleGetMediaNodes(req, res);
  }

  if (req.method === 'POST') {
    if (url.includes('/heartbeat')) {
      return handlePostHeartbeat(req, res);
    }
    return handlePostMediaNodes(req, res);
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
