const crypto = require('crypto');
const db = require('../db/index');

// A node is considered online only if it has heartbeated recently.
// This is computed at query time rather than trusted from a `status`
// column a heartbeat script might forget to flip back on crash/restart.
const HEARTBEAT_FRESHNESS_SECONDS = parseInt(process.env.MEDIA_NODE_HEARTBEAT_FRESHNESS_SECONDS || '90', 10);

/**
 * Picks the least-loaded online media node, optionally preferring a
 * specific region (falls back to any online node if none match the
 * region, so a single-region deployment still works without special
 * casing). Returns null if no online node exists at all -- callers
 * should treat that as "no media node assigned yet" rather than fail
 * camera creation outright, since a single-node setup may configure
 * VITE_HLS_BASE_URL directly instead of using this registry.
 */
async function pickMediaNodeForCamera({ preferredRegion } = {}) {
  const { rows } = await db.query(
    `SELECT
       n.id, n.region, n.public_hls_url, n.capacity,
       count(c.id)::int AS current_cameras,
       (n.last_heartbeat_at > now() - interval '${HEARTBEAT_FRESHNESS_SECONDS} seconds') AS is_online
     FROM media_nodes n
     LEFT JOIN cameras c ON c.media_node_id = n.id
     GROUP BY n.id
     HAVING n.last_heartbeat_at > now() - interval '${HEARTBEAT_FRESHNESS_SECONDS} seconds'
       AND count(c.id) < n.capacity
     ORDER BY (n.region = $1) DESC, count(c.id) ASC
     LIMIT 1`,
    [preferredRegion || null],
  );
  return rows[0] || null;
}

function generateHeartbeatSecret() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = { pickMediaNodeForCamera, generateHeartbeatSecret, HEARTBEAT_FRESHNESS_SECONDS };
