import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/env';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (pool) {
    return pool;
  }

  if (!config.databaseUrl) {
    return null;
  }

  const poolConfig: PoolConfig = {
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  // Enable SSL for cloud PostgreSQL providers (e.g. Neon, Supabase, Render)
  if (config.databaseUrl.includes('sslmode=require') || config.isProduction) {
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    // Log safe error without connection strings or credentials
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });

  return pool;
}

export interface DbHealthStatus {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  message: string;
}

export async function checkDatabaseConnection(): Promise<DbHealthStatus> {
  if (!config.databaseUrl) {
    return {
      configured: false,
      connected: false,
      message: 'DATABASE_URL is not configured in environment.',
    };
  }

  const dbPool = getPool();
  if (!dbPool) {
    return {
      configured: false,
      connected: false,
      message: 'PostgreSQL connection pool could not be initialized.',
    };
  }

  const start = Date.now();
  try {
    const client = await dbPool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return {
        configured: true,
        connected: true,
        latencyMs,
        message: 'PostgreSQL database connection is healthy.',
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database connection error';
    return {
      configured: true,
      connected: false,
      message: `Database connection failed: ${errorMessage}`,
    };
  }
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database query failed: DATABASE_URL is not configured.');
  }
  return dbPool.query<T>(text, params);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
