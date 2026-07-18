const db = require('../db/index');
const { requireAuth, getAccessibleCameraIds } = require('./_auth');
const { pickMediaNodeForCamera } = require('./_media_nodes');
const { logAudit, getIp } = require('./_audit');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res);
    if (!auth) return; // response already sent (401/403/503)

    try {
      const accessibleIds = await getAccessibleCameraIds(auth);
      // accessibleIds === null means "no extra restriction" (org_admin/
      // platform_admin); an operator with zero assignments gets an
      // empty result, not the whole organization's cameras.
      if (accessibleIds !== null && accessibleIds.length === 0) {
        res.status(200).json({ success: true, count: 0, cameras: [] });
        return;
      }

      // hls_base_url comes from the camera's assigned media node when
      // one exists (Phase 5 multi-node setup); the frontend falls back
      // to VITE_HLS_BASE_URL for cameras with no node assigned yet
      // (e.g. single-node deployments that haven't adopted the
      // registry, or a node that was never configured).
      //
      // rtsp_url is omitted for operator-level callers: it may contain
      // credentials and the frontend only uses HLS for playback.
      //
      // Runs via queryAsOrg (Phase 6 RLS): cameras has Row Level
      // Security enabled, so this needs app.current_org_id set for the
      // policy to match -- see db/migrations/007_rls_audit_logs.sql.
      const isAdmin = auth.userType === 'org_admin' || auth.userType === 'platform_admin';
      const baseSelect = isAdmin
        ? `
          SELECT c.id, c.name, c.rtsp_url, c.location, c.lat, c.lng, c.enabled,
                 c.resolution, c.fps, c.codec, n.public_hls_url AS hls_base_url
          FROM cameras c
          LEFT JOIN media_nodes n ON n.id = c.media_node_id`
        : `
          SELECT c.id, c.name, c.location, c.lat, c.lng, c.enabled,
                 c.resolution, c.fps, c.codec, n.public_hls_url AS hls_base_url
          FROM cameras c
          LEFT JOIN media_nodes n ON n.id = c.media_node_id`;

      const result = accessibleIds === null
        ? await db.queryAsOrg(auth.organizationId, `${baseSelect} WHERE c.organization_id = $1 ORDER BY c.id`, [auth.organizationId])
        : await db.queryAsOrg(auth.organizationId, `${baseSelect} WHERE c.organization_id = $1 AND c.id = ANY($2::varchar[]) ORDER BY c.id`,
            [auth.organizationId, accessibleIds]);
      res.status(200).json({ success: true, count: result.rows.length, cameras: result.rows });
    } catch (err) {
      console.error('GET /api/cameras error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const auth = await requireAuth(req, res, { roles: ['platform_admin', 'org_admin'] });
    if (!auth) return;

    try {
      const { id, name, rtsp_url, location, lat, lng, enabled = true, resolution, fps, codec, region } = req.body || {};
      if (!id || !name) {
        res.status(400).json({ success: false, error: 'id and name are required' });
        return;
      }
      // Ownership check: if a camera with this id already exists under a
      // DIFFERENT organization, refuse -- an org_admin must not be able to
      // overwrite another tenant's camera just by guessing/reusing its id.
      // This deliberately uses queryAsPlatformAdmin (RLS bypass) rather
      // than queryAsOrg: the whole point is to see whether the id is
      // taken by ANOTHER org, which a tenant-scoped query would never
      // reveal (RLS would just hide that row, making the id look free).
      const existing = await db.queryAsPlatformAdmin('SELECT organization_id, media_node_id FROM cameras WHERE id = $1', [id]);
      if (existing.rows.length > 0 && existing.rows[0].organization_id !== auth.organizationId) {
        res.status(403).json({ success: false, error: 'A camera with this id belongs to a different organization' });
        return;
      }

      // Only assign a node for a genuinely new camera -- an update to
      // an existing camera keeps whatever node it already had rather
      // than silently reassigning it (that's a deliberate operation,
      // not a side effect of editing the name/location).
      let mediaNodeId = existing.rows[0]?.media_node_id ?? null;
      if (existing.rows.length === 0) {
        const node = await pickMediaNodeForCamera({ preferredRegion: region });
        mediaNodeId = node?.id || null; // null is fine -- falls back to VITE_HLS_BASE_URL on the frontend
      }

      // The nested `sites` subquery below also runs under this same
      // app.current_org_id (sites has RLS too), so it only ever finds
      // this caller's own site -- correct, since a camera must belong
      // to a site in the same organization.
      await db.queryAsOrg(
        auth.organizationId,
        `INSERT INTO cameras (id, name, rtsp_url, location, lat, lng, enabled, resolution, fps, codec, organization_id, site_id, media_node_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
           COALESCE((SELECT site_id FROM cameras WHERE id = $1::VARCHAR(20)), (SELECT id FROM sites WHERE organization_id = $11 ORDER BY created_at ASC LIMIT 1)),
           $12)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, rtsp_url=EXCLUDED.rtsp_url, location=EXCLUDED.location,
           lat=EXCLUDED.lat, lng=EXCLUDED.lng,
           enabled=EXCLUDED.enabled, resolution=EXCLUDED.resolution, fps=EXCLUDED.fps,
           codec=EXCLUDED.codec, updated_at=now()`,
        [id, name, rtsp_url || null, location || null, lat || null, lng || null, enabled, resolution || null, fps || null, codec || null, auth.organizationId, mediaNodeId],
      );

      await logAudit({
        organizationId: auth.organizationId,
        userId: auth.userId,
        action: existing.rows.length === 0 ? 'camera.create' : 'camera.update',
        resourceType: 'camera',
        resourceId: id,
        metadata: { name, media_node_id: mediaNodeId },
        ipAddress: getIp(req),
      });

      res.status(201).json({ success: true, message: 'Camera saved', media_node_id: mediaNodeId });
    } catch (err) {
      console.error('Error saving camera:', err);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const auth = await requireAuth(req, res, { roles: ['platform_admin', 'org_admin'] });
    if (!auth) return;

    try {
      const { id } = req.query;
      if (!id) {
        res.status(400).json({ success: false, error: 'id is required' });
        return;
      }
      const result = await db.queryAsOrg(
        auth.organizationId,
        'DELETE FROM cameras WHERE id = $1 AND organization_id = $2',
        [id, auth.organizationId],
      );
      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Camera not found in your organization' });
        return;
      }

      await logAudit({
        organizationId: auth.organizationId,
        userId: auth.userId,
        action: 'camera.delete',
        resourceType: 'camera',
        resourceId: id,
        ipAddress: getIp(req),
      });

      res.status(200).json({ success: true, message: 'Camera deleted' });
    } catch (err) {
      console.error('Error deleting camera:', err);
      res.status(500).json({ success: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
