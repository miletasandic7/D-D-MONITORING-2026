const db = require('../../../db/index');

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

    let havingClauses = [];
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

    const results = rows.map((row) => ({
      ...row,
      attributes: row.attributes || [],
    }));

    res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    console.error('Error fetching search attributes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


function safeLower(value) {
  return String(value || '').toLowerCase();
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function filterFallbackData(query) {
  const {
    object_type,
    color,
    equipment,
    camera_id,
    zone,
    direction,
    dwell_min,
    min_confidence = 0.5,
    start_date,
    end_date,
  } = query;

  const objectTypeFilter = safeLower(object_type);
  const colorFilter = safeLower(color);
  const equipmentFilter = safeLower(equipment);
  const cameraFilter = safeLower(camera_id);
  const zoneFilter = safeLower(zone);
  const directionFilter = safeLower(direction);
  const dwellMin = toNumber(dwell_min, 0);
  const minConfidenceFilter = toNumber(min_confidence, 0.5);

  let results = fallbackDetections.filter((item) => item.confidence >= minConfidenceFilter);

  if (objectTypeFilter) {
    results = results.filter((item) => safeLower(item.object_type).includes(objectTypeFilter));
  }
  if (cameraFilter) {
    results = results.filter((item) => safeLower(item.camera_id || '').includes(cameraFilter));
  }
  if (zoneFilter) {
    results = results.filter((item) => safeLower(item.zone || item.location || '').includes(zoneFilter));
  }
  if (directionFilter) {
    results = results.filter((item) => safeLower(item.direction || '').includes(directionFilter));
  }
  if (dwellMin > 0) {
    results = results.filter((item) => Number(item.dwell_seconds || 0) >= dwellMin);
  }

  if (colorFilter) {
    results = results.filter((item) =>
      item.attributes.some(
        (attr) =>
          safeLower(attr.attribute_type) === 'color' &&
          safeLower(attr.attribute_value).includes(colorFilter)
      )
    );
  }

  if (equipmentFilter) {
    results = results.filter((item) =>
      item.attributes.some(
        (attr) =>
          safeLower(attr.attribute_type) === 'equipment' &&
          safeLower(attr.attribute_value).includes(equipmentFilter)
      )
    );
  }

  if (start_date) {
    const startTs = new Date(start_date).getTime();
    if (Number.isFinite(startTs)) {
      results = results.filter((item) => new Date(item.timestamp).getTime() >= startTs);
    }
  }

  if (end_date) {
    const endTs = new Date(end_date).getTime();
    if (Number.isFinite(endTs)) {
      results = results.filter((item) => new Date(item.timestamp).getTime() <= endTs);
    }
  }

  return results;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const {
      object_type,
      color,
      equipment,
      camera_id,
      zone,
      direction,
      dwell_min,
      min_confidence = 0.5,
      start_date,
      end_date,
    } = req.query;

    if (!hasSupabaseConfig()) {
      const results = filterFallbackData(req.query);
      res.status(200).json({ success: true, count: results.length, results });
      return;
    }

    const minConfidenceFilter = toNumber(min_confidence, 0.5);
    const detectionQuery = {
      select: 'id,event_id,object_type,confidence,bounding_box,timestamp,created_at',
      order: 'timestamp.desc',
      confidence: `gte.${minConfidenceFilter}`,
    };

    if (object_type) detectionQuery.object_type = `ilike.*${String(object_type)}*`;
    if (camera_id) detectionQuery.camera_id = `eq.${String(camera_id)}`;
    if (zone) detectionQuery.zone = `ilike.*${String(zone)}*`;
    if (direction) detectionQuery.direction = `ilike.*${String(direction)}*`;
    if (dwell_min) detectionQuery.dwell_seconds = `gte.${toNumber(dwell_min, 0)}`;

    const detections = await supabaseRestRequest('ai_detections', detectionQuery);

    let matchingIds = detections.map((item) => item.id);

    if (color) {
      const colorMatches = await supabaseRestRequest('object_attributes', {
        select: 'detection_id',
        attribute_type: 'eq.color',
        attribute_value: `ilike.*${String(color)}*`,
      });
      const colorIds = new Set(colorMatches.map((item) => item.detection_id));
      matchingIds = matchingIds.filter((id) => colorIds.has(id));
    }

    if (equipment) {
      const equipmentMatches = await supabaseRestRequest('object_attributes', {
        select: 'detection_id',
        attribute_type: 'eq.equipment',
        attribute_value: `ilike.*${String(equipment)}*`,
      });
      const equipmentIds = new Set(equipmentMatches.map((item) => item.detection_id));
      matchingIds = matchingIds.filter((id) => equipmentIds.has(id));
    }

    if (!matchingIds.length) {
      res.status(200).json({ success: true, count: 0, results: [] });
      return;
    }

    const attributes = await supabaseRestRequest('object_attributes', {
      select: 'id,detection_id,attribute_type,attribute_value,confidence,created_at',
      detection_id: `in.(${matchingIds.join(',')})`,
      order: 'id.asc',
    });

    const attributeMap = new Map();
    for (const attribute of attributes) {
      if (!attributeMap.has(attribute.detection_id)) {
        attributeMap.set(attribute.detection_id, []);
      }
      attributeMap.get(attribute.detection_id).push(attribute);
    }

    const results = detections
      .filter((item) => matchingIds.includes(item.id))
      .filter((item) => {
        if (start_date && new Date(item.timestamp).getTime() < new Date(start_date).getTime()) {
          return false;
        }

        if (end_date && new Date(item.timestamp).getTime() > new Date(end_date).getTime()) {
          return false;
        }

        return true;
      })
      .map((item) => ({
        ...item,
        attributes: attributeMap.get(item.id) || [],
      }));

    res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    console.error('Error fetching search attributes:', err);
    const results = filterFallbackData(req.query);
    res.status(200).json({ success: true, count: results.length, results });
  }
};
