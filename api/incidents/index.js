const db = require('../../db/index');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  if (!db.hasDatabase) {
    res.status(200).json({ success: true, count: 0, incidents: [], statuses: ALLOWED_STATUSES });
    return;
  }

  try {

    const { rows } = await db.query(`
      SELECT
        a.id,
        a.event_id,
        a.object_type,
        a.confidence,
        COALESCE(a.bounding_box->>'incident_status', 'New') AS status,
        a.timestamp,
        e.camera_id,
        e.severity,
        e.description AS source_description
      FROM ai_detections a
      JOIN events e ON a.event_id = e.id
      WHERE e.is_dismissed = FALSE
      ORDER BY a.timestamp DESC
      LIMIT 100
    `);

    const incidents = rows.map((row) => ({
      event_id: row.event_id,
      detection_id: row.id,
      object_type: row.object_type,
      confidence: row.confidence,
      timestamp: row.timestamp,
      source: row.source_description || `Event #${row.event_id}`,
      status: row.status || 'New',
      camera_id: row.camera_id,
      subtitle: `Confidence ${Math.round(Number(row.confidence) * 100)}%`,
    }));

    res.status(200).json({ success: true, count: incidents.length, incidents, statuses: ALLOWED_STATUSES });
  } catch (err) {
    console.error('GET /api/incidents error:', err.message);
    res.status(200).json({ success: true, count: 0, incidents: [], statuses: ALLOWED_STATUSES, warning: err.message });
  }
};
