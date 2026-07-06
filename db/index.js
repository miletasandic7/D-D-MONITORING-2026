let Pool;
try {
  Pool = require('pg').Pool;
} catch (e) {
  Pool = null;
}

try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, env vars come from host
}

const connectionString = process.env.DATABASE_URL;
const hasDatabase = Boolean(connectionString) && Boolean(Pool);

const pool = hasDatabase
  ? new Pool({
      connectionString,
      ssl: { 
        rejectUnauthorized: false,
        mode: 'require'
      },
      max: 10, // Maximum pool size for transaction pooler
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : null;

module.exports = {
  hasDatabase,
  query: (text, params) => {
    if (!pool) {
      throw new Error('No database connection available');
    }
    return pool.query(text, params);
  },
};
