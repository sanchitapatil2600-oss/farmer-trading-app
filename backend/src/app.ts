import express, { Express } from 'express';
import cors from 'cors';
import { listingsRouter } from './routes/listings';
import { offersRouter, listingOffersRouter } from './routes/offers';
import { dealsRouter } from './routes/deals';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { farmersRouter } from './routes/farmers';
import { buyersRouter } from './routes/buyers';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
    : [];

  // Basic security and parsing middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
      if (!origin) {
        return callback(null, true);
      }

      // In non-production, permit all origins (including local dev servers)
      if (!isProduction) {
        return callback(null, true);
      }

      // In production, strictly enforce allowed origins from CLIENT_ORIGIN
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: origin ${origin} is not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json());

  // Mount API base routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/farmers', farmersRouter);
  app.use('/api/buyers', buyersRouter);
  app.use('/api/listings/:id/offers', listingOffersRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/offers', offersRouter);
  app.use('/api/deals', dealsRouter);

  // Fallback 404 handler
  app.use(notFoundHandler);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}
