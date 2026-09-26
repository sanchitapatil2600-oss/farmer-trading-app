import { Request, Response, NextFunction } from 'express';
import { verifyJwt, hashToken } from '../utils/token';
import { isSessionValid } from '../db/repositories/sessionRepository';
import { findUserById } from '../db/repositories/userRepository';
import { UserRole, UserStatus } from '../types/database';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  tokenHash: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware that authenticates incoming requests using a Bearer token,
 * verifies session validity against database revocation records,
 * and ensures user account status is ACTIVE.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please provide a valid Bearer token.',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is empty.',
      },
    });
    return;
  }

  try {
    // 1. Verify cryptographic JWT signature
    const payload = verifyJwt(token);

    // 2. Compute token hash to verify server-side session status
    const tokenHash = hashToken(token);
    const validSession = await isSessionValid(tokenHash);
    if (!validSession) {
      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_REVOKED',
          message: 'Your session has been terminated or expired. Please log in again.',
        },
      });
      return;
    }

    // 3. Verify user exists and status is ACTIVE
    const user = await findUserById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user account no longer exists.',
        },
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: `Your account is ${user.status.toLowerCase()}. Access to marketplace operations is restricted.`,
        },
      });
      return;
    }

    // Attach validated user context to request
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      tokenHash,
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: `Token validation failed: ${message}`,
      },
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Enforces role restrictions server-side.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before role verification.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}].`,
        },
      });
      return;
    }

    next();
  };
}
