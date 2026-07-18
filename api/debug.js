const https = require('https');
const db = require('../db/index');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // GET request - return env info and test DB
  if (req.method === 'GET') {
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM organizations');
      dbStatus = 'OK - ' + result.rows[0].count + ' organizations';
    } catch (err) {
      dbStatus = 'ERROR';
      dbError = err.message;
    }
    
    let usersCount = 'unknown';
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM users');
      usersCount = result.rows[0].count + ' users';
    } catch (err) {
      usersCount = 'ERROR: ' + err.message;
    }
    
    res.json({
      supabaseUrl: SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseKey: SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      hasDatabase: Boolean(process.env.DATABASE_URL),
      dbStatus,
      dbError,
      usersCount,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // POST request - test full auth flow
  if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }
    
    try {
      // Step 1: Verify with Supabase
      const user = await verifyWithSupabase(token);
      
      // Step 2: Check if user exists in DB
      let dbUser = null;
      let dbError = null;
      try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
        dbUser = result.rows[0] || null;
      } catch (err) {
        dbError = err.message;
      }
      
      res.json({ 
        success: true, 
        supabaseUser: {
          id: user.id,
          email: user.email
        },
        dbUser,
        dbError
      });
    } catch (err) {
      res.status(401).json({ 
        error: 'Auth failed', 
        message: err.message 
      });
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
