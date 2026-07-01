const db = require('../db/index');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    if (!db.hasDatabase) {
      res.status(200).json({ success: true, count: 0, cameras: [] });
      return;
    }
    try {
      const result = await db.query(
        'SELECT id, name, rtsp_url, location, enabled, resolution, fps, codec FROM cameras ORDER BY id',
      );
      res.status(200).json({ success: true, count: result.rows.length, cameras: result.rows });
    } catch (err) {
      console.error('GET /api/cameras error:', err.message);
      // Return empty list instead of crashing the dashboard
      res.status(200).json({ success: true, count: 0, cameras: [], warning: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { id, name, rtsp_url, location, enabled = true, resolution, fps, codec } = req.body || {};
      if (!id || !name) {
        res.status(400).json({ success: false, error: 'id and name are required' });
        return;
      }
      await db.query(
        `INSERT INTO cameras (id, name, rtsp_url, location, enabled, resolution, fps, codec)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, rtsp_url=EXCLUDED.rtsp_url, location=EXCLUDED.location,
           enabled=EXCLUDED.enabled, resolution=EXCLUDED.resolution, fps=EXCLUDED.fps,
           codec=EXCLUDED.codec, updated_at=now()`,
        [id, name, rtsp_url || null, location || null, enabled, resolution || null, fps || null, codec || null],
      );
      res.status(201).json({ success: true, message: 'Camera saved' });
    } catch (err) {
      console.error('Error saving camera:', err);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
};

