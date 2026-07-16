// NOTE: this file is a leftover from an early local-prototype phase.
// Production (and this app's real API in /api and /db/index.js) uses
// PostgreSQL (Neon) via DATABASE_URL, NOT SQLite. This module is not
// imported by any live API route. Kept only for db/migrate.js / manual
// local experiments; safe to delete once confirmed unused in your workflow.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file will be located in the api folder
const dbPath = path.join(__dirname, 'surveillance.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

module.exports = {
  // Run a query that returns rows (SELECT)
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  // Run a query that modifies data (INSERT, UPDATE, DELETE)
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  // Close the database (optional)
  close: () => {
    db.close();
  }
};
