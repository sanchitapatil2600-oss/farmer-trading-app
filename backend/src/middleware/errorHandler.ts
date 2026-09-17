import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.path} was not found.`,
    },
  });
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  // Log error on server side for observability (never return secrets to client)
  if (!config.isProduction) {
    console.error(`[Error] ${code}: ${err.message}`, err.stack);
  } else {
    console.error(`[Error] ${code}: ${err.message}`);
  }

  const clientMessage =
    config.isProduction && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: clientMessage,
    },
  });
}
