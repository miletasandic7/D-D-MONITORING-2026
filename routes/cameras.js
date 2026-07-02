const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.get('/api/cameras', async (req, res) => {
  try {
    if (!db.hasDatabase) {
      res.status(503).json({ success: false, error: 'Database not configured' });
      return;
    }
    const { rows } = await db.query(
      'SELECT id, name, rtsp_url, location, lat, lng, enabled, resolution, fps, codec FROM cameras ORDER BY id',
    );
    res.json({ success: true, count: rows.length, cameras: rows });
  } catch (err) {
    console.error('Error fetching cameras:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/cameras', async (req, res) => {
  try {
    if (!db.hasDatabase) {
      res.status(503).json({ success: false, error: 'Database not configured' });
      return;
    }
    const { id, name, rtsp_url, location, lat, lng, enabled = true, resolution, fps, codec } = req.body || {};
    if (!id || !name) {
      res.status(400).json({ success: false, error: 'id and name are required' });
      return;
    }
    await db.query(
      `INSERT INTO cameras (id, name, rtsp_url, location, lat, lng, enabled, resolution, fps, codec)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         name=EXCLUDED.name, rtsp_url=EXCLUDED.rtsp_url, location=EXCLUDED.location,
         lat=EXCLUDED.lat, lng=EXCLUDED.lng,
         enabled=EXCLUDED.enabled, resolution=EXCLUDED.resolution, fps=EXCLUDED.fps,
         codec=EXCLUDED.codec, updated_at=now()`,
      [id, name, rtsp_url || null, location || null, lat || null, lng || null, enabled, resolution || null, fps || null, codec || null],
    );
    res.status(201).json({ success: true, message: 'Camera saved' });
  } catch (err) {
    console.error('Error saving camera:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/cameras', async (req, res) => {
  try {
    if (!db.hasDatabase) {
      res.status(503).json({ success: false, error: 'Database not configured' });
      return;
    }
    const { id } = req.query;
    if (!id) {
      res.status(400).json({ success: false, error: 'id is required' });
      return;
    }
    await db.query('DELETE FROM cameras WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Camera deleted' });
  } catch (err) {
    console.error('Error deleting camera:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
