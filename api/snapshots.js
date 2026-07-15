const db = require('../db/index');
const { requireAuth, canAccessCamera } = require('./_auth');
const { uploadObject } = require('./_storage');

// Reasonable upper bound for a single JPEG frame capture -- protects
// against a misbehaving client posting something huge.
const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024; // 8 MB

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

  const { camera_id: cameraId, image_base64: imageBase64 } = req.body || {};
  if (!cameraId || !imageBase64) {
    res.status(400).json({ success: false, error: 'camera_id and image_base64 are required' });
    return;
  }

  try {
    const allowed = await canAccessCamera(auth, cameraId);
    if (!allowed) {
      res.status(404).json({ success: false, error: 'Camera not found or not accessible' });
      return;
    }

    // Accept either a raw base64 string or a data: URL
    // (data:image/jpeg;base64,....) -- the browser's canvas.toDataURL()
    // produces the latter, so support it directly without asking the
    // frontend to strip the prefix itself.
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      res.status(400).json({ success: false, error: 'image_base64 decoded to an empty buffer' });
      return;
    }
    if (buffer.length > MAX_SNAPSHOT_BYTES) {
      res.status(413).json({ success: false, error: `Snapshot exceeds ${MAX_SNAPSHOT_BYTES} byte limit` });
      return;
    }

    const takenAt = new Date();
    const key = `snapshots/${auth.organizationId}/${cameraId}/${takenAt.toISOString().replace(/[:.]/g, '-')}.jpg`;

    const storageUrl = await uploadObject({ key, body: buffer, contentType: 'image/jpeg' });

    const inserted = await db.query(
      `INSERT INTO snapshots (camera_id, organization_id, taken_by_user_id, taken_at, storage_url, trigger, file_size_bytes)
       VALUES ($1, $2, $3, $4, $5, 'manual', $6)
       RETURNING id, taken_at, storage_url`,
      [cameraId, auth.organizationId, auth.userId, takenAt, storageUrl, buffer.length],
    );

    res.status(201).json({ success: true, snapshot: inserted.rows[0] });
  } catch (err) {
    console.error('POST /api/snapshots error:', err.message);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
};
