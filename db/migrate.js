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
