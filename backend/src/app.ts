import express, { Express } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { farmersRouter } from './routes/farmers';
import { buyersRouter } from './routes/buyers';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing middleware
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Mount API base routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/farmers', farmersRouter);
  app.use('/api/buyers', buyersRouter);

  // Fallback 404 handler
  app.use(notFoundHandler);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}
