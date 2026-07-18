const db = require('../db/index');
const { requireAuth, getAccessibleCameraIds } = require('./_auth');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

// GET /api/incidents - list incidents
async function handleGetIncidents(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const accessibleIds = await getAccessibleCameraIds(auth);
    if (accessibleIds !== null && accessibleIds.length === 0) {
      res.status(200).json({ success: true, count: 0, incidents: [], statuses: ALLOWED_STATUSES });
      return;
    }

    const { rows } = accessibleIds === null
      ? await db.queryAsOrg(auth.organizationId, `
          SELECT DISTINCT ON (i.id)
            i.id, i.event_id, i.status, i.severity, i.assigned_operator_id,
            i.created_at, i.acknowledged_at, i.resolved_at,
            e.camera_id, e.description AS source_description,
            a.object_type, a.confidence
          FROM incidents i
          JOIN events e ON e.id = i.event_id
          LEFT JOIN (
            SELECT event_id, object_type, MAX(confidence) AS confidence
            FROM ai_detections
            GROUP BY event_id, object_type
          ) a ON a.event_id = e.id
          WHERE e.is_dismissed = FALSE AND i.organization_id = $1
          ORDER BY i.id, i.created_at DESC
          LIMIT 100
        `, [auth.organizationId])
      : await db.queryAsOrg(auth.organizationId, `
          SELECT DISTINCT ON (i.id)
            i.id, i.event_id, i.status, i.severity, i.assigned_operator_id,
            i.created_at, i.acknowledged_at, i.resolved_at,
            e.camera_id, e.description AS source_description,
            a.object_type, a.confidence
          FROM incidents i
          JOIN events e ON e.id = i.event_id
          LEFT JOIN (
            SELECT event_id, object_type, MAX(confidence) AS confidence
            FROM ai_detections
            GROUP BY event_id, object_type
          ) a ON a.event_id = e.id
          WHERE e.is_dismissed = FALSE AND i.organization_id = $1 AND i.camera_id = ANY($2::varchar[])
          ORDER BY i.id, i.created_at DESC
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
}

// GET /api/incidents/activity?eventId=X - get incident activity
async function handleGetActivity(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { eventId } = req.query;
  if (!eventId) {
    res.status(400).json({ success: false, error: 'eventId query parameter is required' });
    return;
  }

  try {
    const incidentResult = await db.queryAsOrg(
      auth.organizationId,
      'SELECT id, organization_id FROM incidents WHERE event_id = $1',
      [eventId],
    );
    if (incidentResult.rows.length === 0 || incidentResult.rows[0].organization_id !== auth.organizationId) {
      res.status(404).json({ success: false, error: 'Incident not found in your organization' });
      return;
    }

    const { rows } = await db.query(
      `SELECT l.id, l.action, l.note, l.created_at, l.user_id, u.email AS user_email
       FROM incident_activity_log l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.incident_id = $1
       ORDER BY l.created_at ASC`,
      [incidentResult.rows[0].id],
    );

    res.status(200).json({ success: true, event_id: eventId, activity: rows });
  } catch (err) {
    console.error('GET /api/incidents/activity error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/incidents/evidence?eventId=X - get incident evidence
async function handleGetEvidence(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { eventId } = req.query;
  if (!eventId) {
    res.status(400).json({ success: false, error: 'eventId query parameter is required' });
    return;
  }

  try {
    const incidentResult = await db.queryAsOrg(
      auth.organizationId,
      'SELECT id, organization_id FROM incidents WHERE event_id = $1',
      [eventId],
    );
    if (incidentResult.rows.length === 0 || incidentResult.rows[0].organization_id !== auth.organizationId) {
      res.status(404).json({ success: false, error: 'Incident not found in your organization' });
      return;
    }

    const { rows: evidenceRows } = await db.query(
      `SELECT s.id, s.type, s.storage_url, s.created_at
       FROM snapshots s
       WHERE s.event_id = $1
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [eventId],
    );

    res.status(200).json({ success: true, event_id: eventId, evidence: evidenceRows });
  } catch (err) {
    console.error('GET /api/incidents/evidence error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/incidents/status?eventId=X - update incident status
async function handlePatchStatus(req, res) {
  const { eventId } = req.query;
  const { status, assigned_operator_id: assignedOperatorId, assign_to_self: assignToSelf } = req.body || {};

  if (status && !ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    return;
  }
  if (!status && assignedOperatorId === undefined && !assignToSelf) {
    res.status(400).json({ success: false, error: 'Provide status, assigned_operator_id, or assign_to_self' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const incidentResult = await db.queryAsOrg(
      auth.organizationId,
      'SELECT id, organization_id, status, acknowledged_at FROM incidents WHERE event_id = $1',
      [eventId],
    );
    if (incidentResult.rows.length === 0 || incidentResult.rows[0].organization_id !== auth.organizationId) {
      res.status(404).json({ success: false, error: 'Incident not found in your organization' });
      return;
    }
    const incident = incidentResult.rows[0];

    let targetOperatorId;
    if (assignToSelf) {
      targetOperatorId = auth.userId;
    } else if (assignedOperatorId !== undefined) {
      if (assignedOperatorId !== null && assignedOperatorId !== auth.userId
          && auth.userType !== 'org_admin' && auth.userType !== 'platform_admin') {
        res.status(403).json({ success: false, error: 'Only org_admin/platform_admin can assign incidents to other operators' });
        return;
      }
      targetOperatorId = assignedOperatorId;
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
      if (status === 'Acknowledged' && !incident.acknowledged_at) {
        updates.push(`acknowledged_at = now()`);
      }
      if ((status === 'Resolved' || status === 'False Alarm')) {
        updates.push(`resolved_at = now()`);
      }
    }
    if (targetOperatorId !== undefined) {
      updates.push(`assigned_operator_id = $${paramIndex++}`);
      values.push(targetOperatorId);
    }

    values.push(incident.id);
    await db.queryAsOrg(auth.organizationId, `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    if (status) {
      await db.query(
        `INSERT INTO incident_activity_log (incident_id, user_id, action, note) VALUES ($1, $2, 'status_changed', $3)`,
        [incident.id, auth.userId, `Status changed from ${incident.status} to ${status}`],
      );
    }
    if (targetOperatorId !== undefined) {
      await db.query(
        `INSERT INTO incident_activity_log (incident_id, user_id, action, note) VALUES ($1, $2, $3, $4)`,
        [incident.id, auth.userId, targetOperatorId ? 'assigned' : 'unassigned',
          targetOperatorId ? `Assigned to operator ${targetOperatorId}` : 'Unassigned'],
      );
    }

    const { logAudit, getIp } = require('./_audit');
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'incident.updated',
      resourceType: 'incident',
      resourceId: incident.id,
      metadata: { event_id: eventId, status, assigned_operator_id: targetOperatorId },
      ipAddress: getIp(req),
    });

    res.status(200).json({ success: true, event_id: eventId, status: status || incident.status, assigned_operator_id: targetOperatorId });
  } catch (err) {
    console.error('PATCH /api/incidents/status error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = async (req, res) => {
  const url = req.url;

  if (req.method === 'GET') {
    if (url.includes('/activity')) {
      return handleGetActivity(req, res);
    }
    if (url.includes('/evidence')) {
      return handleGetEvidence(req, res);
    }
    return handleGetIncidents(req, res);
  }

  if (req.method === 'PATCH' && url.includes('/status')) {
    return handlePatchStatus(req, res);
  }

  if (req.method === 'POST' && url.includes('/manual')) {
    return handlePostManualIncident(req, res);
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
};

// POST /api/incidents/manual - manually create an incident
async function handlePostManualIncident(req, res) {
  const auth = await requireAuth(req, res, { roles: ['platform_admin', 'org_admin'] });
  if (!auth) return;

  const { camera_id, severity = 'Medium', notes = '' } = req.body || {};
  if (!camera_id) {
    res.status(400).json({ success: false, error: 'camera_id is required' });
    return;
  }

  try {
    // Verify camera belongs to organization
    const cameraResult = await db.queryAsOrg(
      auth.organizationId,
      'SELECT id FROM cameras WHERE id = $1 AND organization_id = $2',
      [camera_id, auth.organizationId],
    );
    if (cameraResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Camera not found in your organization' });
      return;
    }

    // Create a manual event and incident
    const eventResult = await db.queryAsOrg(
      auth.organizationId,
      `INSERT INTO events (organization_id, camera_id, event_type, description, is_dismissed)
       VALUES ($1, $2, 'manual_incident', $3, FALSE)
       RETURNING id, created_at`,
      [auth.organizationId, camera_id, notes || 'Manually created incident'],
    );
    const eventId = eventResult.rows[0].id;

    const incidentResult = await db.queryAsOrg(
      auth.organizationId,
      `INSERT INTO incidents (organization_id, event_id, camera_id, status, severity, assigned_operator_id)
       VALUES ($1, $2, $3, 'New', $4, $5)
       RETURNING id, created_at`,
      [auth.organizationId, eventId, camera_id, severity, auth.userId],
    );

    await db.query(
      `INSERT INTO incident_activity_log (incident_id, user_id, action, note)
       VALUES ($1, $2, 'created', $3)`,
      [incidentResult.rows[0].id, auth.userId, 'Manually created incident'],
    );

    const { logAudit, getIp } = require('./_audit');
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'incident.created',
      resourceType: 'incident',
      resourceId: incidentResult.rows[0].id,
      metadata: { camera_id, severity, event_id: eventId },
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      incident_id: incidentResult.rows[0].id,
      event_id: eventId,
      status: 'New',
      severity,
    });
  } catch (err) {
    console.error('POST /api/incidents/manual error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
