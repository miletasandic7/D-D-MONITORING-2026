const jwt = require('jsonwebtoken');
const db = require('../db/index');
const https = require('https');

// =========================================================
// Phase 1 RBAC: authenticate the Supabase-issued JWT, sync a local
// profile row into `users`, and return { userId, organizationId,
// userType } for the caller to use in tenant-scoped queries.
//
// First-login default (explicit product decision): every new user is
// created as `org_admin` on the single "Default Organization" seeded
// by migration 001. There is no per-organization signup/invite flow
// yet -- that's a Phase 2 concern. This is a deliberate simplification,
// not an oversight; revisit once multiple real customer organizations
// exist.
// =========================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verify JWT with Supabase using direct HTTP call
async function verifyTokenWithSupabase(token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/auth/v1/user`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const user = JSON.parse(data);
            resolve(user);
          } catch (e) {
            reject(new Error('Failed to parse Supabase response'));
          }
        } else {
          reject(new Error(`Supabase returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Supabase request failed: ${e.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Supabase request timed out'));
    });

    req.end();
  });
}

async function verifyToken(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    const err = new Error('Missing bearer token');
    err.statusCode = 401;
    throw err;
  }
  const token = header.slice('Bearer '.length).trim();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[auth:503] SUPABASE_URL or SUPABASE_ANON_KEY env var is not set on this deployment');
    const err = new Error('Server auth is not configured');
    err.statusCode = 503;
    throw err;
  }

  let user;
  try {
    user = await verifyTokenWithSupabase(token);
  } catch (err) {
    console.error('[auth:401] Token verification failed:', err.message);
    const newErr = new Error('Invalid or expired token');
    newErr.statusCode = 401;
    throw newErr;
  }

  if (!user.id || !user.email) {
    const err = new Error('Token missing required claims (sub, email)');
    err.statusCode = 401;
    throw err;
  }

  return { authUserId: user.id, email: user.email };
}

async function getDefaultOrganizationId() {
  const { rows } = await db.query(
    `SELECT id FROM organizations WHERE name = 'Default Organization' ORDER BY created_at ASC LIMIT 1`,
  );
  if (rows.length === 0) {
    console.error('[auth:503] No "Default Organization" row found -- have db/migrations/001_multi_tenant_foundation.sql (and later) been run against this DATABASE_URL?');
    const err = new Error('No default organization configured. Run db/migrations/001_multi_tenant_foundation.sql first.');
    err.statusCode = 503;
    throw err;
  }
  return rows[0].id;
}

async function syncUserProfile({ authUserId, email }) {
  const existing = await db.query('SELECT id, organization_id, user_type, status FROM users WHERE id = $1', [authUserId]);
  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [authUserId]);
    return user;
  }

  // First login: create the profile as org_admin on the default org.
  const organizationId = await getDefaultOrganizationId();
  
  // Insert with all required columns
  const inserted = await db.query(
    `INSERT INTO users (id, name, email, emailVerified, createdAt, updatedAt, organization_id, user_type, status, last_login_at)
     VALUES ($1, $2, $2, true, now(), now(), $3, 'org_admin', 'active', now())
     ON CONFLICT (id) DO UPDATE SET last_login_at = now()
     RETURNING id, organization_id, user_type, status`,
    [authUserId, email, organizationId],
  );
  return inserted.rows[0];
}

/**
 * Authenticates the request and returns the caller's profile, or sends
 * an error response and returns null. Usage in an API route:
 *
 *   const auth = await requireAuth(req, res);
 *   if (!auth) return; // response already sent
 */
async function requireAuth(req, res, { roles } = {}) {
  if (!db.hasDatabase) {
    console.error('[auth:503] DATABASE_URL is missing or the "pg" module failed to load -- see /api/health for details');
    res.status(503).json({ success: false, error: 'Database not configured. Set DATABASE_URL environment variable.' });
    return null;
  }

  let identity;
  try {
    identity = await verifyToken(req);
  } catch (err) {
    res.status(err.statusCode || 401).json({ success: false, error: err.message });
    return null;
  }

  let profile;
  try {
    profile = await syncUserProfile(identity);
  } catch (err) {
    console.error('User profile sync error:', err.message);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
    return null;
  }

  if (profile.status !== 'active') {
    res.status(403).json({ success: false, error: 'Account is not active' });
    return null;
  }

  if (roles && roles.length > 0 && !roles.includes(profile.user_type)) {
    res.status(403).json({ success: false, error: 'Insufficient permissions for this action' });
    return null;
  }

  return {
    userId: profile.id,
    organizationId: profile.organization_id,
    userType: profile.user_type,
  };
}

/**
 * Returns the set of camera ids this caller is allowed to see, or null
 * if the caller has unrestricted access to their whole organization
 * (org_admin / platform_admin). Operators are restricted to cameras on
 * sites they're actively assigned to via operator_assignments.
 */
async function getAccessibleCameraIds(auth) {
  if (auth.userType === 'org_admin' || auth.userType === 'platform_admin') {
    return null; // no extra filter -- organization_id scoping is enough
  }

  const { rows } = await db.queryAsOrg(
    auth.organizationId,
    `SELECT c.id
     FROM cameras c
     JOIN operator_assignments oa ON oa.site_id = c.site_id AND oa.active
     WHERE oa.user_id = $1 AND c.organization_id = $2`,
    [auth.userId, auth.organizationId],
  );
  return rows.map((r) => r.id);
}

/**
 * Throws-free check: does this caller have access to a specific camera?
 * Used by endpoints that act on one camera_id (stream tokens, view logs).
 */
async function canAccessCamera(auth, cameraId) {
  // queryAsOrg (Phase 6 RLS): cameras has RLS enabled, so this only
  // ever sees a row if it belongs to the caller's own organization --
  // a camera from another org simply won't be returned, which the
  // `rows.length === 0` check below already treats as "no access".
  const { rows } = await db.queryAsOrg(auth.organizationId, 'SELECT organization_id, site_id FROM cameras WHERE id = $1', [cameraId]);
  if (rows.length === 0) return false;
  const camera = rows[0];
  if (camera.organization_id !== auth.organizationId) return false;
  if (auth.userType === 'org_admin' || auth.userType === 'platform_admin') return true;

  const assignment = await db.query(
    'SELECT 1 FROM operator_assignments WHERE user_id = $1 AND site_id = $2 AND active',
    [auth.userId, camera.site_id],
  );
  return assignment.rows.length > 0;
}

module.exports = { requireAuth, getAccessibleCameraIds, canAccessCamera };
