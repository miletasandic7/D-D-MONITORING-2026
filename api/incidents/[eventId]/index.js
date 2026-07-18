const db = require('../../../db/index');
const { requireAuth } = require('../../_auth');
const { logAudit, getIp } = require('../../_audit');
const { keyFromPublicUrl, getPresignedDownloadUrl, isConfigured } = require('../../_storage');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

// Combined handler for /api/incidents/:eventId/*
// Supports: /activity (GET), /status (PATCH), /evidence (GET)
module.exports = async (req, res) => {
  const { eventId, path: pathInfo } = req.query;

  // Route based on path
  if (pathInfo === 'activity') {
    return handleActivity(req, res, eventId);
  }
  if (pathInfo === 'status') {
    return handleStatus(req, res, eventId);
  }
  if (pathInfo === 'evidence') {
    return handleEvidence(req, res, eventId);
  }

  res.status(404).json({ success: false, error: 'Not found' });
};

async function handleActivity(req, res, eventId) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

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
    console.error('GET /api/incidents/:eventId/activity error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function handleStatus(req, res, eventId) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

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
}

async function handleEvidence(req, res, eventId) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const eventResult = await db.queryAsOrg(
      auth.organizationId,
      `SELECT e.id, e.camera_id, e.event_type, e.severity, e.description, e.timestamp
       FROM events e WHERE e.id = $1`,
      [eventId],
    );
    if (eventResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Event not found in your organization' });
      return;
    }
    const event = eventResult.rows[0];

    const recordingsResult = await db.queryAsOrg(
      auth.organizationId,
      `SELECT id, storage_url, status, duration_seconds, size_bytes, start_time, end_time
       FROM recordings WHERE event_id = $1 ORDER BY start_time`,
      [eventId],
    );

    const snapshotsResult = await db.queryAsOrg(
      auth.organizationId,
      `SELECT id, storage_url, taken_at, trigger
       FROM snapshots
       WHERE camera_id = $1 AND taken_at BETWEEN $2::timestamptz - interval '5 minutes' AND $2::timestamptz + interval '5 minutes'
       ORDER BY taken_at`,
      [event.camera_id, event.timestamp],
    );

    const storageReady = isConfigured();

    const recordings = await Promise.all(recordingsResult.rows.map(async (r) => {
      let downloadUrl = null;
      if (storageReady && r.storage_url && r.status === 'completed') {
        const key = keyFromPublicUrl(r.storage_url);
        if (key) {
          try { downloadUrl = await getPresignedDownloadUrl(key, { expiresInSeconds: 3600 }); }
          catch { console.error('[evidence] presign failed for recording', r.id); }
        }
      }
      return {
        id: r.id, status: r.status, duration_seconds: r.duration_seconds, size_bytes: r.size_bytes,
        start_time: r.start_time, end_time: r.end_time, download_url: downloadUrl,
      };
    }));

    const snapshots = await Promise.all(snapshotsResult.rows.map(async (s) => {
      let downloadUrl = null;
      if (storageReady && s.storage_url) {
        const key = keyFromPublicUrl(s.storage_url);
        if (key) {
          try { downloadUrl = await getPresignedDownloadUrl(key, { expiresInSeconds: 3600 }); }
          catch { console.error('[evidence] presign failed for snapshot', s.id); }
        }
      }
      return { id: s.id, taken_at: s.taken_at, trigger: s.trigger, download_url: downloadUrl };
    }));

    res.status(200).json({
      success: true,
      event,
      recordings,
      snapshots,
      storage_configured: storageReady,
    });
  } catch (err) {
    console.error('GET /api/incidents/:eventId/evidence error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
