const db = require('../db/index');
const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res, { roles: ['org_admin', 'platform_admin'] });
    if (!auth) return;

    try {
      const result = await db.queryAsOrg(
        auth.organizationId,
        'SELECT id, name, email, user_type, status, createdat, last_login_at FROM users ORDER BY createdat DESC'
      );
      res.json({ users: result.rows });
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
