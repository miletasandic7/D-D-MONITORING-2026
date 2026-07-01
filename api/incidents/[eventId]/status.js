const db = require('../../../db/index');

const ALLOWED_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved', 'False Alarm'];

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const eventId = Number(req.query.eventId);
  const status = req.body?.status;

  if (!Number.isFinite(eventId) || eventId <= 0) {
    res.status(400).json({ success: false, error: 'Invalid event id' });
    return;
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid status value' });
    return;
  }

  try {
    if (!db.hasDatabase) {
      res.status(503).json({ success: false, error: 'Database not configured' });
      return;
    }

    const result = await db.query(
      `UPDATE ai_detections
       SET bounding_box = jsonb_set(
         COALESCE(bounding_box, '{}'),
         '{incident_status}',
         to_jsonb($1::text)
       )
       WHERE event_id = $2`,
      [status, eventId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'No detections found for this event id' });
      return;
    }

    res.status(200).json({ success: true, updatedCount: result.rowCount, event_id: eventId, status });
  } catch (err) {
    console.error('Error updating incident status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


function buildStatusPayload(row, status) {
  if ('incident_status' in row) {
    return { incident_status: status };
  }

  if ('status' in row) {
    return { status };
  }

  if ('event_status' in row) {
    return { event_status: status };
  }

  if ('bounding_box' in row) {
    const baseBox = row.bounding_box && typeof row.bounding_box === 'object' ? row.bounding_box : {};
    return {
      bounding_box: {
        ...baseBox,
        incident_status: status,
        incident_status_updated_at: new Date().toISOString(),
      },
    };
  }

  if ('meta' in row) {
    const baseMeta = row.meta && typeof row.meta === 'object' ? row.meta : {};
    return {
      meta: {
        ...baseMeta,
        incident_status: status,
        incident_status_updated_at: new Date().toISOString(),
      },
    };
  }

  return { incident_status: status };
}

function getRowId(row) {
  return row.id ?? row.detection_id ?? row.attribute_id;
}

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const eventId = Number(req.query.eventId);
  const status = req.body?.status;

  if (!Number.isFinite(eventId) || eventId <= 0) {
    res.status(400).json({ success: false, error: 'Invalid event id' });
    return;
  }

  if (!STATUS_TO_DB[status]) {
    res.status(400).json({ success: false, error: 'Invalid status value' });
    return;
  }

  try {
    if (!hasSupabaseConfig()) {
      res.status(503).json({ success: false, error: 'Supabase configuration is missing' });
      return;
    }

    const rows = await supabaseRestRequest('search_attributes', {
      select: '*',
      event_id: `eq.${eventId}`,
      limit: '100',
    });

    if (!rows.length) {
      res.status(404).json({ success: false, error: 'No search_attributes rows found for this event id' });
      return;
    }

    const updates = await Promise.all(
      rows.map((row) => {
        const rowId = getRowId(row);
        if (!rowId) {
          return [];
        }

        const payload = buildStatusPayload(row, status);

        return supabaseRestRequest(
          'search_attributes',
          { id: `eq.${rowId}`, select: '*' },
          {
            method: 'PATCH',
            body: payload,
            headers: {
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
          }
        );
      })
    );

    const updatedCount = updates.reduce((acc, rows) => acc + (Array.isArray(rows) ? rows.length : 0), 0);

    res.status(200).json({ success: true, updatedCount, event_id: eventId, status });
  } catch (err) {
    console.error('Error updating incident status:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INCIDENT_UPDATE_ERROR',
        message: err.message,
        event_id: eventId,
        timestamp: new Date().toISOString(),
      },
    });
  }
};
