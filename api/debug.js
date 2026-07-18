const https = require('https');
const db = require('../db/index');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // GET request - return env info and test DB
  if (req.method === 'GET') {
    let results = {
      supabaseUrl: SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseKey: SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      hasDatabase: Boolean(process.env.DATABASE_URL),
    };
    
    // Test all tables
    const tables = ['organizations', 'users', 'cameras', 'incidents', 'events', 'media_nodes'];
    results.tables = {};
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        results.tables[table] = { status: 'OK', count: parseInt(result.rows[0].count) };
      } catch (err) {
        results.tables[table] = { status: 'ERROR', error: err.message };
      }
    }
    
    results.timestamp = new Date().toISOString();
    res.json(results);
    return;
  }
  
  // POST request - test full auth flow step by step
  if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }
    
    const steps = {};
    
    try {
      // Step 1: Verify with Supabase
      steps.supabase = 'testing...';
      const user = await verifyWithSupabase(token);
      steps.supabase = { success: true, userId: user.id, email: user.email };
      
      // Step 2: Check if user exists in DB
      steps.dbUserCheck = 'testing...';
      try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
        steps.dbUserCheck = { exists: result.rows.length > 0, data: result.rows[0] || null };
      } catch (err) {
        steps.dbUserCheck = { error: err.message };
      }
      
      // Step 3: Get default organization
      steps.getOrg = 'testing...';
      try {
        const org = await db.query("SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1");
        steps.getOrg = { success: true, orgId: org.rows[0]?.id };
      } catch (err) {
        steps.getOrg = { error: err.message };
      }
      
      // Step 4: Try to sync user
      steps.syncUser = 'testing...';
      if (steps.dbUserCheck?.exists) {
        try {
          await db.query('UPDATE users SET last_login_at = now(), updatedAt = now() WHERE id = $1', [user.id]);
          steps.syncUser = { success: true, action: 'updated existing user' };
        } catch (err) {
          steps.syncUser = { error: err.message };
        }
      } else {
        const orgId = steps.getOrg?.orgId;
        if (orgId) {
          try {
            await db.query(
              `INSERT INTO users (id, name, email, emailVerified, createdAt, updatedAt, organization_id, user_type, status, last_login_at)
               VALUES ($1, $2, $2, true, now(), now(), $3, 'org_admin', 'active', now())`,
              [user.id, user.email, orgId]
            );
            steps.syncUser = { success: true, action: 'created new user' };
          } catch (err) {
            steps.syncUser = { error: err.message };
          }
        }
      }
      
      res.json({ success: true, steps });
    } catch (err) {
      res.status(401).json({ error: 'Auth failed', message: err.message, steps });
    }
    return;
  }
  
  res.status(405).json({ error: 'Method Not Allowed' });
};

function verifyWithSupabase(token) {
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

    const req2 = https.request(options, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        if (res2.statusCode === 200) {
          try {
            const user = JSON.parse(data);
            resolve(user);
          } catch (e) {
            reject(new Error('Failed to parse Supabase response'));
          }
        } else {
          reject(new Error(`Supabase returned ${res2.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req2.on('error', (e) => {
      reject(new Error(`Supabase request failed: ${e.message}`));
    });

    req2.setTimeout(10000, () => {
      req2.destroy();
      reject(new Error('Supabase request timed out'));
    });

    req2.end();
  });
}
