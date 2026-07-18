const db = require('../../../db/index');
const { requireAuth } = require('../../_auth');
const { keyFromPublicUrl, getPresignedDownloadUrl, isConfigured } = require('../../_storage');

// =========================================================
// GET /api/incidents/:eventId/evidence
//
// Replaces the frontend's old placeholder export (a JSON file with a
// 'Clip URL will be populated once storage is connected' note) with
// the REAL recordings/snapshots for this event, once storage actually
// is connected (Phase 3). Presigned, short-lived download links are
// returned instead of raw storage URLs -- an exported evidence file
// shouldn't contain a permanent, unrevocable link to the bucket.
// =========================================================

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const auth = await requireAuth(req, res);
  if (!auth) return; // response already sent (401/403/503)

  const { eventId } = req.query;

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

    // Snapshots aren't linked to a specific event_id (they're manual,
    // ad-hoc captures), so the closest useful match is any snapshot of
    // the same camera taken within a few minutes of the event.
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
          catch (e) { console.error('[evidence] presign failed for recording', r.id, e.message); }
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
          catch (e) { console.error('[evidence] presign failed for snapshot', s.id, e.message); }
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
};
