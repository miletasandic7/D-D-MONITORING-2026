// NOTE: this script is dead code from the early local-prototype (SQLite)
// phase. Production uses PostgreSQL via DATABASE_URL; real migrations are
// run with `npm run migrate:postgres` (scripts/run-postgres-migrations.js).
// This file is kept only as a historical reference and is NOT imported by
// any live API route or the migrate:postgres script.
const fs = require('fs');
const path = require('path');
const db = require('./sqlite');

(async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  try {
    for (const stmt of statements) {
      await db.run(stmt);
    }
    console.log('Database migrated successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
})();
