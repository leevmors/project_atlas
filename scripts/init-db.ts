#!/usr/bin/env tsx
/**
 * Database initialization script for Project Atlas.
 * Run with: npx tsx scripts/init-db.ts
 * Safe to re-run — all statements use CREATE TABLE IF NOT EXISTS.
 */
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const sql = readFileSync(join(__dirname, 'init-db.sql'), 'utf8');
  console.log('Running DB initialization...');
  await pool.query(sql);
  console.log('Database initialized successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
