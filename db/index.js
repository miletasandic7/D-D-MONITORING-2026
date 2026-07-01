const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const hasDatabase = Boolean(connectionString);

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
      throw new Error('Missing DATABASE_URL environment variable');
    }
    return pool.query(text, params);
  },
};
