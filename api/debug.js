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
