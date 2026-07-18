const db = require('../db/index');
const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    try {
      const result = await db.queryAsOrg(
        auth.organizationId,
        `SELECT 
          ad.id, ad.object_type, ad.confidence, ad.zone, ad."createdAt" as created_at,
          ad.camera_id, c.name as camera_name
        FROM ai_detections ad
        LEFT JOIN cameras c ON ad.camera_id = c.id
        WHERE c.organization_id = $1 OR c.organization_id IS NULL
        ORDER BY ad."createdAt" DESC
        LIMIT 100`,
        [auth.organizationId]
      );
      res.json({ detections: result.rows });
    } catch (err) {
      console.error('Error fetching AI detections:', err);
      res.status(500).json({ error: 'Failed to fetch AI detections' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
