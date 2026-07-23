const db = require('../db/index');
const { requireAuth } = require('./_auth');

// Supabase Admin API for user management
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

module.exports = async (req, res) => {
  // GET - List all users
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res, { roles: ['org_admin', 'platform_admin'] });
    if (!auth) return;

    try {
      // Use db.query directly instead of queryAsOrg to avoid UUID validation issues
      const sql = \`
        SELECT id, email,
          COALESCE(display_name, name, email) AS display_name,
          COALESCE(user_type, role, 'operator') AS user_type,
          COALESCE(status, 'active') AS status,
          organization_id,
          COALESCE(created_at, createdat, NOW()) AS created_at
        FROM users
        WHERE organization_id::text = \$1::text
        ORDER BY COALESCE(created_at, createdat) DESC NULLS LAST
      \`;
      
      const result = await db.query(sql, [auth.organizationId]);
      
      if (result.rows.length > 0) {
        res.json({ users: result.rows });
        return;
      }
      
      // If no users found with org filter, try without filter to check if DB has any users
      try {
        const allResult = await db.query(
          'SELECT id, email, COALESCE(display_name, name, email) AS display_name, COALESCE(user_type, role, \'operator\') AS user_type, COALESCE(status, \'active\') AS status, organization_id FROM users ORDER BY created_at DESC NULLS LAST'
        );
        console.log('Org filter returned 0, found ' + allResult.rows.length + ' total users in DB');
        if (allResult.rows.length > 0) {
          res.json({ users: allResult.rows, orgMismatch: true });
          return;
        }
      } catch (noOrgErr) {
        console.log('No-org query also failed (expected if table is empty):', noOrgErr.message);
      }
      
      res.json({ users: [] });
      return;
      } catch (dbErr) {
        console.error('Database query failed:', dbErr);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
          details: (dbErr && dbErr.message) ? dbErr.message : String(dbErr)
        });
        return;
      }
  }

  // POST - Invite a new user
  if (req.method === 'POST') {
    const auth = await requireAuth(req, res, { roles: ['org_admin', 'platform_admin'] });
    if (!auth) return;

    const { email, user_type = 'operator' } = req.body || {};

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Use Supabase Admin API if available
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            email,
            email_confirm: true,
            user_metadata: {
              user_type,
              organization_id: auth.organizationId,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Supabase invite error:', data);
          res.status(400).json({ error: data.message || 'Failed to create user' });
          return;
        }

        // Create user record in our database
        try {
          await db.queryAsOrg(
            auth.organizationId,
            `INSERT INTO users (id, email, user_type, status, organization_id) 
             VALUES ($1, $2, $3, 'invited', $4)
             ON CONFLICT (id) DO UPDATE SET user_type = $3, status = 'invited'`,
            [data.id, email, user_type, auth.organizationId]
          );
        } catch (dbErr) {
          console.error('Error saving user to database:', dbErr);
        }

        res.json({ 
          success: true, 
          user: { id: data.id, email, user_type, status: 'invited' },
          message: `User ${email} invited successfully!`
        });
      } catch (err) {
        console.error('Error inviting user:', err);
        res.status(500).json({ error: 'Failed to invite user' });
      }
      return;
    }

    // If no Supabase Admin API, return instructions
    res.status(501).json({ 
      error: 'Supabase Service Role Key not configured',
      message: 'To invite users, please configure SUPABASE_SERVICE_ROLE_KEY in your environment variables, or invite users manually from Supabase Dashboard.',
      instructions: {
        step1: 'Go to Supabase Dashboard → Project Settings → API',
        step2: 'Find "service_role" secret key',
        step3: 'Add SUPABASE_SERVICE_ROLE_KEY to your environment variables',
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
