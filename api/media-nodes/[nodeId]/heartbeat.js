const db = require('../../../db/index');

// =========================================================
// POST /api/media-nodes/:nodeId/heartbeat
//
// Called periodically by workers/media-node-heartbeat.js running
// alongside each MediaMTX instance -- NOT a browser/user request, so
// this authenticates via the node's own heartbeat_secret (set at
// creation time in POST /api/media-nodes) rather than a Supabase JWT.
// =========================================================

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  if (!db.hasDatabase) {
    res.status(503).json({ success: false, error: 'Database not configured. Set DATABASE_URL environment variable.' });
    return;
  }

  const { nodeId } = req.query;
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
};
