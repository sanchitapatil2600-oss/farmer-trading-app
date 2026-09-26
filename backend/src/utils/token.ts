import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../types/database';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  sessionId?: string;
}

const DEFAULT_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Computes a SHA-256 hash of an authentication token for safe database storage.
 * Ensures raw tokens are never persisted in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically signed JWT token and returns the token and its expiration date.
 */
export function signToken(
  payload: TokenPayload,
  expiresInSeconds: number = DEFAULT_EXPIRATION_SECONDS
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const token = jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      sessionId: payload.sessionId || crypto.randomUUID(),
    },
    config.authSecret,
    {
      expiresIn: expiresInSeconds,
    }
  );

  return { token, expiresAt };
}

/**
 * Verifies a JWT token's signature and claims.
 * Throws an error if invalid, tampered, or expired.
 */
export function verifyJwt(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.authSecret) as jwt.JwtPayload & TokenPayload;
  if (!decoded.userId || !decoded.role) {
    throw new Error('Invalid token payload structure.');
  }
  return {
    userId: decoded.userId,
    role: decoded.role,
    sessionId: decoded.sessionId,
  };
}
