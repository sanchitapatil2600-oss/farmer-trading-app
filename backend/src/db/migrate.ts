import fs from 'fs';
import path from 'path';
import { getPool } from './index';
import { config } from '../config/env';

export interface MigrationResult {
  version: string;
  name: string;
  applied: boolean;
  message?: string;
}

export async function runMigrations(): Promise<MigrationResult[]> {
  if (!config.databaseUrl) {
    throw new Error('Database migration aborted: DATABASE_URL is not configured in the environment.');
  }

  const pool = getPool();
  if (!pool) {
    throw new Error('Database migration aborted: PostgreSQL connection pool could not be initialized.');
  }

  const client = await pool.connect();
  const results: MigrationResult[] = [];

  try {
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Determine migrations folder path (handle both tsx src and compiled dist)
    const migrationsDirCandidates = [
      path.join(__dirname, 'migrations'),
      path.join(__dirname, '../../src/db/migrations'),
      path.join(process.cwd(), 'src/db/migrations'),
      path.join(process.cwd(), 'backend/src/db/migrations'),
    ];

    let migrationsDir = migrationsDirCandidates.find((dir) => fs.existsSync(dir));
    if (!migrationsDir) {
      throw new Error(`Migration directory not found in candidates: ${migrationsDirCandidates.join(', ')}`);
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const version = file.split('_')[0];
      const name = file;

      // Check if already applied
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        results.push({ version, name, applied: false, message: 'Already applied' });
        continue;
      }

      console.log(`[Migration] Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute within transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, name]
        );
        await client.query('COMMIT');
        console.log(`[Migration] Successfully applied ${file}`);
        results.push({ version, name, applied: true });
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`[Migration] Error applying ${file}:`, migrationErr);
        throw migrationErr;
      }
    }

    return results;
  } finally {
    client.release();
  }
}

// Allow standalone execution via `npx tsx src/db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then((results) => {
      console.log('[Migration] Migration run complete:', results);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Migration run failed:', err.message);
      process.exit(1);
    });
}
