const db = require('../../../db/index');
const { requireAuth } = require('../../_auth');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

  const { eventId } = req.query;
  const { status } = req.body || {};

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    return;
  }

  try {
    // Tenant check: only update incidents that belong to an event in the
    // caller's own organization -- prevents an operator from one tenant
    // from changing another tenant's incident by guessing eventId.
    const eventCheck = await db.query('SELECT organization_id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0 || eventCheck.rows[0].organization_id !== auth.organizationId) {
      res.status(404).json({ success: false, error: 'Incident not found in your organization' });
      return;
    }

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
