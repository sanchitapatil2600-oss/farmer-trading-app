import { createApp } from './app';
import { config } from './config/env';
import { closePool } from './db';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[Server] Farmer Trading Backend running on http://localhost:${config.port}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
  console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await closePool();
    console.log('[Server] Database pool terminated.');
    process.exit(0);
  });

  // Force exit if shutdown takes longer than 5 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export { server };
