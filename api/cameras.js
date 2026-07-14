const db = require('../db/index');
const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res);
    if (!auth) return; // response already sent (401/403/503)

    try {
      const result = await db.query(
        `SELECT id, name, rtsp_url, location, lat, lng, enabled, resolution, fps, codec
         FROM cameras
         WHERE organization_id = $1
         ORDER BY id`,
        [auth.organizationId],
      );
      res.status(200).json({ success: true, count: result.rows.length, cameras: result.rows });
    } catch (err) {
      console.error('GET /api/cameras error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const auth = await requireAuth(req, res, { roles: ['platform_admin', 'org_admin'] });
    if (!auth) return;

    try {
      const { id, name, rtsp_url, location, lat, lng, enabled = true, resolution, fps, codec } = req.body || {};
      if (!id || !name) {
        res.status(400).json({ success: false, error: 'id and name are required' });
        return;
      }
      // Ownership check: if a camera with this id already exists under a
      // DIFFERENT organization, refuse -- an org_admin must not be able to
      // overwrite another tenant's camera just by guessing/reusing its id.
      const existing = await db.query('SELECT organization_id FROM cameras WHERE id = $1', [id]);
      if (existing.rows.length > 0 && existing.rows[0].organization_id !== auth.organizationId) {
        res.status(403).json({ success: false, error: 'A camera with this id belongs to a different organization' });
        return;
      }

      await db.query(
        `INSERT INTO cameras (id, name, rtsp_url, location, lat, lng, enabled, resolution, fps, codec, organization_id, site_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
           COALESCE((SELECT site_id FROM cameras WHERE id = $1::VARCHAR(20)), (SELECT id FROM sites WHERE organization_id = $11 ORDER BY created_at ASC LIMIT 1)))
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, rtsp_url=EXCLUDED.rtsp_url, location=EXCLUDED.location,
           lat=EXCLUDED.lat, lng=EXCLUDED.lng,
           enabled=EXCLUDED.enabled, resolution=EXCLUDED.resolution, fps=EXCLUDED.fps,
           codec=EXCLUDED.codec, updated_at=now()`,
        [id, name, rtsp_url || null, location || null, lat || null, lng || null, enabled, resolution || null, fps || null, codec || null, auth.organizationId],
      );
      res.status(201).json({ success: true, message: 'Camera saved' });
    } catch (err) {
      console.error('Error saving camera:', err);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const auth = await requireAuth(req, res, { roles: ['platform_admin', 'org_admin'] });
    if (!auth) return;

    try {
      const { id } = req.query;
      if (!id) {
        res.status(400).json({ success: false, error: 'id is required' });
        return;
      }
      const result = await db.query(
        'DELETE FROM cameras WHERE id = $1 AND organization_id = $2',
        [id, auth.organizationId],
      );
      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Camera not found in your organization' });
        return;
      }
      res.status(200).json({ success: true, message: 'Camera deleted' });
    } catch (err) {
      console.error('Error deleting camera:', err);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
