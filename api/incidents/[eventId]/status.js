const db = require('../../../db/index');
const { requireAuth } = require('../../_auth');
const { logAudit, getIp } = require('../../_audit');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

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

  try {
    // Tenant check: only touch incidents that belong to the caller's
    // own organization -- prevents cross-tenant access by guessing
    // eventId. Runs via queryAsOrg (Phase 6 RLS) as a second layer on
    // top of this app-level check: even if this WHERE clause somehow
    // omitted the org filter, RLS would still only return this
    // caller's own rows.
    const incidentResult = await db.queryAsOrg(
      auth.organizationId,
      'SELECT id, organization_id, status FROM incidents WHERE event_id = $1',
      [eventId],
    );
    if (incidentResult.rows.length === 0 || incidentResult.rows[0].organization_id !== auth.organizationId) {
      res.status(404).json({ success: false, error: 'Incident not found in your organization' });
      return;
    }
    const incident = incidentResult.rows[0];

    // Only org_admin/platform_admin can assign an incident to someone
    // else; an operator may only assign it to themselves (pick it up)
    // or via assign_to_self.
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
    console.error('PATCH /api/incidents/:eventId/status error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
