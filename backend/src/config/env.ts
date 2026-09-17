import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory first, then root directory fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl?: string;
  isProduction: boolean;
}

export function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('Configuration error: PORT must be a valid port number (1-65535).');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = process.env.DATABASE_URL?.trim() || undefined;

  // Basic format validation if DATABASE_URL is provided
  if (databaseUrl && !databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error('Configuration error: DATABASE_URL must start with postgres:// or postgresql://');
  }

  return {
    port,
    nodeEnv,
    databaseUrl,
    isProduction: nodeEnv === 'production',
  };
}

export const config = loadConfig();
