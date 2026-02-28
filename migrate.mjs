#!/usr/bin/env node
/**
 * Database migration script for production deployment.
 * Reads SQL migration files from ./drizzle/ and executes them in order.
 * Uses a __drizzle_migrations tracking table to avoid re-running migrations.
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[migrate] DATABASE_URL not set, skipping migrations');
    return;
  }

  console.log('[migrate] Connecting to database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(databaseUrl);
    console.log('[migrate] Connected successfully');
  } catch (err) {
    console.error('[migrate] Failed to connect to database:', err.message);
    process.exit(1);
  }

  try {
    // Create migrations tracking table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(255) NOT NULL,
        created_at BIGINT
      )
    `);

    // Get list of already-applied migrations
    const [appliedRows] = await connection.execute('SELECT hash FROM __drizzle_migrations');
    const applied = new Set(appliedRows.map(r => r.hash));
    console.log(`[migrate] Already applied: ${applied.size} migrations`);

    // Find SQL migration files
    const drizzleDir = path.join(__dirname, 'drizzle');
    const sqlFiles = fs.readdirSync(drizzleDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`[migrate] Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      const hash = file; // Use filename as hash
      if (applied.has(hash)) {
        console.log(`[migrate] Skipping (already applied): ${file}`);
        continue;
      }

      console.log(`[migrate] Applying: ${file}`);
      const sql = fs.readFileSync(path.join(drizzleDir, file), 'utf-8');
      
      // Split by --> statement-breakpoint and execute each statement
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await connection.execute(stmt);
        } catch (err) {
          // Ignore "already exists" errors to allow idempotent runs
          if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
              err.code === 'ER_DUP_FIELDNAME' ||
              err.message.includes('already exists') ||
              err.message.includes('Duplicate column')) {
            console.log(`[migrate] Warning (ignored): ${err.message}`);
          } else {
            throw err;
          }
        }
      }

      // Record this migration as applied
      await connection.execute(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        [hash, Date.now()]
      );
      console.log(`[migrate] Applied: ${file}`);
    }

    console.log('[migrate] All migrations complete');
  } finally {
    await connection.end();
  }
}

runMigrations().catch(err => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
