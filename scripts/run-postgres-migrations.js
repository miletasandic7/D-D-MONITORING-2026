#!/usr/bin/env node

try {
  require('dotenv').config();
} catch (e) {
  // env vars come from the host in production/CI
}

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const repoRoot = path.join(__dirname, '..');
const dbDir = path.join(repoRoot, 'db');
const migrationsDir = path.join(dbDir, 'migrations');

function getMigrationFiles() {
  const migrationNames = fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  return [
    path.join(dbDir, 'schema.sql'),
    ...migrationNames.map((name) => path.join(migrationsDir, name)),
  ];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[migrate:postgres] DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const files = getMigrationFiles();
  let failed = false;

  try {
    await client.connect();
    console.log(`[migrate:postgres] Applying ${files.length} SQL file(s)...`);

    for (const filePath of files) {
      const relativePath = path.relative(repoRoot, filePath);
      const sql = fs.readFileSync(filePath, 'utf8').trim();

      if (!sql) {
        console.log(`[migrate:postgres] Skipping empty file: ${relativePath}`);
        continue;
      }

      console.log(`[migrate:postgres] Running ${relativePath}`);
      // Migration files in this repository intentionally contain
      // multi-statement SQL (BEGIN/COMMIT, DO $$...$$ blocks, etc.), so
      // they are executed as one trusted string read from disk rather
      // than split on semicolons.
      await client.query(sql);
    }

    console.log('[migrate:postgres] All migrations applied successfully.');
  } catch (error) {
    console.error('[migrate:postgres] Migration failed:', error.message);
    failed = true;
  }

  try {
    await client.end();
  } catch (error) {
    console.warn('[migrate:postgres] Failed to close DB connection cleanly:', error.message);
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
}

main();
