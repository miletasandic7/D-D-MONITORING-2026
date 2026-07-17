const crypto = require('crypto');
const db = require('../../db/index');
const { requireAuth, canAccessCamera } = require('../_auth');

// How long an issued stream token remains valid. Matches a typical
// live-viewing session length; the frontend re-requests a fresh token
// when the video element is (re)mounted, so this doesn't need to be
// long-lived. Configurable via env for deployments with different
// operator workflow needs.
const TOKEN_TTL_SECONDS = parseInt(process.env.STREAM_TOKEN_TTL_SECONDS || '14400', 10); // 4h default

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

  const { camera_id: cameraId } = req.body || {};
  if (!cameraId) {
    res.status(400).json({ success: false, error: 'camera_id is required' });
    return;
  }

  try {
    const allowed = await canAccessCamera(auth, cameraId);
    if (!allowed) {
      res.status(404).json({ success: false, error: 'Camera not found or not accessible' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || null;

    const [tokenResult, viewLogResult] = await Promise.all([
      db.query(
        `INSERT INTO camera_stream_tokens (camera_id, user_id, token, expires_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [cameraId, auth.userId, token, expiresAt],
      ),
      db.queryAsOrg(
        auth.organizationId,
        `INSERT INTO camera_view_logs (camera_id, user_id, organization_id, ip_address)
         VALUES ($1, $2, $3, $4) RETURNING id, started_at`,
        [cameraId, auth.userId, auth.organizationId, ipAddress],
      ),
    ]);

    res.status(201).json({
      success: true,
      viewLogId: viewLogResult.rows[0].id,
      startedAt: viewLogResult.rows[0].started_at,
      streamToken: token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('POST /api/camera-views error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
