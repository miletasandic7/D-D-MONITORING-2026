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
      ssl: { rejectUnauthorized: false },
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
