const db = require('../../db/index');
const { detections } = require('../_data');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

const DEMO_CAMERAS = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04', 'CAM-05'];

function buildDemoIncidents() {
  return detections.map((d, i) => ({
    event_id: d.event_id,
    detection_id: d.id,
    object_type: d.object_type,
    confidence: d.confidence,
    timestamp: d.timestamp,
    source: `Demo Event #${d.event_id}`,
    status: i === 0 ? 'New' : i === 1 ? 'Acknowledged' : 'New',
    camera_id: DEMO_CAMERAS[i % DEMO_CAMERAS.length],
    zone: ['entrance', 'parking', 'lobby'][i % 3],
    direction: ['entering', 'exiting', 'entering'][i % 3],
    dwell_seconds: [12, 45, 8][i % 3],
    subtitle: `Confidence ${Math.round(d.confidence * 100)}%`,
    attributes: d.attributes || [],
  }));
}

module.exports = async (req, res) => {
  if (req.method === 'PATCH') {
    res.status(200).json({ success: true, message: 'Status updated (demo mode)' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  if (!db.hasDatabase) {
    const incidents = buildDemoIncidents();
    res.status(200).json({ success: true, count: incidents.length, incidents, statuses: ALLOWED_STATUSES });
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
    const incidents = buildDemoIncidents();
    res.status(200).json({ success: true, count: incidents.length, incidents, statuses: ALLOWED_STATUSES, warning: err.message });
  }
};
