const express = require('express');
const router = express.Router();
const db = require('../db/index');

function safeLower(v) { return String(v || '').toLowerCase(); }
function toNumber(v, fb) { const n = Number(v); return Number.isFinite(n) ? n : fb; }

router.get('/api/search/attributes', async (req, res) => {
  try {
    if (!db.hasDatabase) {
      res.status(503).json({ success: false, error: 'Database not configured' });
      return;
    }

    const {
      object_type, color, equipment, camera_id,
      min_confidence = '0.5', start_date, end_date,
    } = req.query;

    const minConf = toNumber(min_confidence, 0.5);
    const params = [minConf];
    const conditions = ['a.confidence >= $1'];
    let p = 2;

    if (object_type) { conditions.push(`LOWER(a.object_type) LIKE $${p++}`); params.push(`%${safeLower(object_type)}%`); }
    if (camera_id)   { conditions.push(`e.camera_id = $${p++}`);             params.push(String(camera_id)); }
    if (start_date)  { conditions.push(`a.timestamp >= $${p++}`);            params.push(start_date); }
    if (end_date)    { conditions.push(`a.timestamp <= $${p++}`);            params.push(end_date); }

    const having = [];
    if (color)     { having.push(`bool_or(LOWER(b.attribute_type)='color' AND LOWER(b.attribute_value) LIKE $${p++})`);     params.push(`%${safeLower(color)}%`); }
    if (equipment) { having.push(`bool_or(LOWER(b.attribute_type)='equipment' AND LOWER(b.attribute_value) LIKE $${p++})`); params.push(`%${safeLower(equipment)}%`); }

    const sql = `
      SELECT a.id, a.event_id, a.object_type, a.confidence, a.timestamp, e.camera_id,
             jsonb_agg(jsonb_build_object(
               'attribute_type', b.attribute_type,
               'attribute_value', b.attribute_value,
               'confidence', b.confidence
             )) FILTER (WHERE b.id IS NOT NULL) AS attributes
      FROM ai_detections a
      JOIN events e ON a.event_id = e.id
      LEFT JOIN object_attributes b ON a.id = b.detection_id
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      GROUP BY a.id, a.event_id, a.object_type, a.confidence, a.timestamp, e.camera_id
      ${having.length ? 'HAVING ' + having.join(' AND ') : ''}
      ORDER BY a.timestamp DESC
      LIMIT 200
    `;

    const { rows } = await db.query(sql, params);
    const results = rows.map((r) => ({ ...r, attributes: r.attributes || [] }));
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


router.get('/api/search/attributes', async (req, res) => {
  const {
    object_type,
    color,
    equipment,
    min_confidence = 0.5,
    start_date,
    end_date,
  } = req.query;

  const values = [];
  const where = [];

  if (object_type) {
    where.push(`LOWER(a.object_type) LIKE ?`);
    values.push(`%${object_type.toLowerCase()}%`);
  }
  if (color) {
    where.push(`b.attribute_type = 'color' AND LOWER(b.attribute_value) LIKE ?`);
    values.push(`%${color.toLowerCase()}%`);
  }
  if (equipment) {
    where.push(`b.attribute_type = 'equipment' AND LOWER(b.attribute_value) LIKE ?`);
    values.push(`%${equipment.toLowerCase()}%`);
  }
  if (min_confidence) {
    where.push(`a.confidence >= ?`);
    values.push(min_confidence);
  }
  if (start_date) {
    where.push(`a.timestamp >= ?`);
    values.push(start_date);
  }
  if (end_date) {
    where.push(`a.timestamp <= ?`);
    values.push(end_date);
  }

  const sql = `
    SELECT a.*, json_agg(b.*) AS attributes
    FROM ai_detections a
    JOIN object_attributes b ON a.id = b.detection_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY a.id
    ORDER BY a.timestamp DESC
  `;

  try {
    const rows = await db.all(sql, values);
    res.json({ success: true, count: rows.length, results: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
