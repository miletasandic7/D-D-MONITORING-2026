const db = require('../../db/index');
const { requireAuth } = require('../_auth');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

  const { viewId } = req.query;

  try {
    // Ownership check baked into the WHERE clause: a caller can only
    // close their own view session, and only if it's still open.
    const result = await db.query(
      `UPDATE camera_view_logs
       SET ended_at = now()
       WHERE id = $1 AND user_id = $2 AND ended_at IS NULL
       RETURNING id, started_at, ended_at`,
      [viewId, auth.userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Open view session not found' });
      return;
    }

    res.status(200).json({ success: true, viewLog: result.rows[0] });
  } catch (err) {
    console.error('PATCH /api/camera-views/:viewId error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
