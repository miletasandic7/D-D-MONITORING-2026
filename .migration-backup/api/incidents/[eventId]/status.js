const db = require('../../../db/index');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const { eventId } = req.query;
  const { status } = req.body || {};

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    return;
  }

  if (!db.hasDatabase) {
    res.status(200).json({ success: true, event_id: eventId, status });
    return;
  }

  try {
    await db.query(
      `UPDATE ai_detections
       SET bounding_box = jsonb_set(COALESCE(bounding_box, '{}'), '{incident_status}', to_jsonb($1::text))
       WHERE event_id = $2`,
      [status, eventId],
    );
    res.status(200).json({ success: true, event_id: eventId, status });
  } catch (err) {
    console.error('PATCH /api/incidents/:eventId/status error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
