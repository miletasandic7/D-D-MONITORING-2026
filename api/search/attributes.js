const db = require('../../db/index');

function safeLower(value) {
  return String(value || '').toLowerCase();
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  if (!db.hasDatabase) {
    res.status(503).json({ success: false, error: 'Database not configured. Set DATABASE_URL environment variable.' });
    return;
  }

  try {
    const {
      object_type,
      color,
      equipment,
      camera_id,
      min_confidence = '0.5',
      start_date,
      end_date,
    } = req.query;

    const minConf = toNumber(min_confidence, 0.5);
    const params = [minConf];
    const conditions = ['a.confidence >= $1'];
    let paramIdx = 2;

    if (object_type) {
      conditions.push(`LOWER(a.object_type) LIKE $${paramIdx++}`);
      params.push(`%${safeLower(object_type)}%`);
    }
    if (camera_id) {
      conditions.push(`e.camera_id = $${paramIdx++}`);
      params.push(String(camera_id));
    }
    if (start_date) {
      conditions.push(`a.timestamp >= $${paramIdx++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`a.timestamp <= $${paramIdx++}`);
      params.push(end_date);
    }

    const havingClauses = [];
    if (color) {
      havingClauses.push(
        `bool_or(LOWER(b.attribute_type) = 'color' AND LOWER(b.attribute_value) LIKE $${paramIdx++})`
      );
      params.push(`%${safeLower(color)}%`);
    }
    if (equipment) {
      havingClauses.push(
        `bool_or(LOWER(b.attribute_type) = 'equipment' AND LOWER(b.attribute_value) LIKE $${paramIdx++})`
      );
      params.push(`%${safeLower(equipment)}%`);
    }

    const sql = `
      SELECT
        a.id,
        a.event_id,
        a.object_type,
        a.confidence,
        COALESCE(a.bounding_box->>'incident_status', 'New') AS status,
        a.timestamp,
        e.camera_id,
        e.severity,
        jsonb_agg(jsonb_build_object(
          'attribute_type', b.attribute_type,
          'attribute_value', b.attribute_value,
          'confidence', b.confidence
        )) FILTER (WHERE b.id IS NOT NULL) AS attributes
      FROM ai_detections a
      JOIN events e ON a.event_id = e.id
      LEFT JOIN object_attributes b ON a.id = b.detection_id
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      GROUP BY a.id, a.event_id, a.object_type, a.confidence, a.bounding_box, a.timestamp, e.camera_id, e.severity
      ${havingClauses.length ? 'HAVING ' + havingClauses.join(' AND ') : ''}
      ORDER BY a.timestamp DESC
      LIMIT 200
    `;

    const { rows } = await db.query(sql, params);
    const results = rows.map((row) => ({ ...row, attributes: row.attributes || [] }));

    res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    console.error('Error fetching search attributes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
