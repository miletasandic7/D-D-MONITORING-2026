const db = require('../db/index');

// =========================================================
// Diagnostics endpoint -- NOT auth-gated on purpose, so it can be hit
// immediately after a deployment to answer "why is everything 503ing"
// without needing a valid JWT first. Reports presence/health only,
// never actual secret values.
//
// GET /api/health
// =========================================================

module.exports = async (req, res) => {
  const checks = {
    node_version: process.version,
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      SUPABASE_JWT_SECRET: Boolean(process.env.SUPABASE_JWT_SECRET),
      STORAGE_BUCKET: Boolean(process.env.STORAGE_BUCKET),
      STORAGE_ACCESS_KEY_ID: Boolean(process.env.STORAGE_ACCESS_KEY_ID),
      STORAGE_SECRET_ACCESS_KEY: Boolean(process.env.STORAGE_SECRET_ACCESS_KEY),
    },
    pg_module_loaded: db.hasDatabase !== undefined,
    database: { configured: db.hasDatabase, connected: null, has_default_organization: null },
  };

  if (db.hasDatabase) {
    try {
      await db.query('SELECT 1');
      checks.database.connected = true;
    } catch (err) {
      checks.database.connected = false;
      checks.database.error = err.message;
      console.error('[health] DB connectivity check failed:', err.message);
    }

    if (checks.database.connected) {
      try {
        const { rows } = await db.query(
          `SELECT count(*)::int AS count FROM organizations WHERE name = 'Default Organization'`,
        );
        checks.database.has_default_organization = rows[0].count > 0;
      } catch (err) {
        // Most likely cause: migrations 001+ haven't been run against
        // this database yet, so the `organizations` table doesn't
        // exist at all.
        checks.database.has_default_organization = false;
        checks.database.migration_error = err.message;
        console.error('[health] organizations table check failed (migrations not run?):', err.message);
      }
    }
  }

  const healthy = checks.env.DATABASE_URL
    && checks.env.SUPABASE_JWT_SECRET
    && checks.database.connected === true
    && checks.database.has_default_organization === true;

  res.status(healthy ? 200 : 503).json({ success: healthy, checks });
};
