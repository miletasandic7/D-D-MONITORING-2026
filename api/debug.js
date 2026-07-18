const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Return environment info (without secrets)
  res.json({
    supabaseUrl: SUPABASE_URL ? 'SET' : 'NOT SET',
    supabaseKey: SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    supabaseUrlValue: SUPABASE_URL ? 
      (SUPABASE_URL.substring(0, 30) + '...') : null,
    hasDatabase: Boolean(process.env.DATABASE_URL),
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
};

// Also handle POST for testing
module.exports.POST = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.json({ error: 'No token provided' });
    return;
  }
  
  // Test Supabase auth
  return new Promise((resolve) => {
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
        res.json({
          statusCode: res2.statusCode,
          response: data.substring(0, 500)
        });
        resolve();
      });
    });

    req2.on('error', (e) => {
      res.json({ error: e.message });
      resolve();
    });

    req2.end();
  });
};
