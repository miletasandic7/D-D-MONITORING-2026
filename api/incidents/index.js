const db = require('../../db/index');
const { requireAuth, getAccessibleCameraIds } = require('../_auth');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

  try {
    const accessibleIds = await getAccessibleCameraIds(auth);
    if (accessibleIds !== null && accessibleIds.length === 0) {
      res.status(200).json({ success: true, count: 0, incidents: [], statuses: ALLOWED_STATUSES });
      return;
    }

    const { rows } = accessibleIds === null
      ? await db.queryAsOrg(auth.organizationId, `
          SELECT id, event_id, status, severity, assigned_operator_id,
            created_at, acknowledged_at, resolved_at,
            camera_id, source_description, object_type, confidence
          FROM (
            SELECT DISTINCT ON (i.id)
              i.id, i.event_id, i.status, i.severity, i.assigned_operator_id,
              i.created_at, i.acknowledged_at, i.resolved_at,
              e.camera_id, e.description AS source_description,
              a.object_type, a.confidence
            FROM incidents i
            JOIN events e ON e.id = i.event_id
            LEFT JOIN ai_detections a ON a.event_id = e.id
            WHERE e.is_dismissed = FALSE AND i.organization_id = $1
            ORDER BY i.id, a.confidence DESC NULLS LAST
          ) deduped
          ORDER BY created_at DESC
          LIMIT 100
        `, [auth.organizationId])
      : await db.queryAsOrg(auth.organizationId, `
          SELECT id, event_id, status, severity, assigned_operator_id,
            created_at, acknowledged_at, resolved_at,
            camera_id, source_description, object_type, confidence
          FROM (
            SELECT DISTINCT ON (i.id)
              i.id, i.event_id, i.status, i.severity, i.assigned_operator_id,
              i.created_at, i.acknowledged_at, i.resolved_at,
              e.camera_id, e.description AS source_description,
              a.object_type, a.confidence
            FROM incidents i
            JOIN events e ON e.id = i.event_id
            LEFT JOIN ai_detections a ON a.event_id = e.id
            WHERE e.is_dismissed = FALSE AND i.organization_id = $1 AND i.camera_id = ANY($2::varchar[])
            ORDER BY i.id, a.confidence DESC NULLS LAST
          ) deduped
          ORDER BY created_at DESC
          LIMIT 100
        `, [auth.organizationId, accessibleIds]);

    const incidents = rows.map((row) => ({
      id: row.id,
      event_id: row.event_id,
      object_type: row.object_type,
      confidence: row.confidence,
      timestamp: row.created_at,
      source: row.source_description || `Event #${row.event_id}`,
      status: row.status,
      severity: row.severity,
      assigned_operator_id: row.assigned_operator_id,
      acknowledged_at: row.acknowledged_at,
      resolved_at: row.resolved_at,
      camera_id: row.camera_id,
      subtitle: row.confidence != null ? `Confidence ${Math.round(Number(row.confidence) * 100)}%` : row.severity,
    }));

    res.status(200).json({ success: true, count: incidents.length, incidents, statuses: ALLOWED_STATUSES });
  } catch (err) {
    console.error('GET /api/incidents error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
