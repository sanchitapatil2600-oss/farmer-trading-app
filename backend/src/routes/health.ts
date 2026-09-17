import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../db';
import { config } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();

  const isHealthy = true; // API server is operational

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    data: {
      status: 'operational',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        configured: dbStatus.configured,
        connected: dbStatus.connected,
        latencyMs: dbStatus.latencyMs,
        status: dbStatus.message,
      },
    },
    message: 'Backend server is operational.',
  });
});
