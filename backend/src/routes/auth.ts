import { Router, Request, Response } from 'express';
import { 
  findUserByIdentifier, 
  findUserByEmail, 
  findUserByPhone, 
  createFarmerUser, 
  createBuyerUser, 
  toSafeUser,
  findUserById
} from '../db/repositories/userRepository';
import { 
  getFarmerProfileByUserId, 
  getBuyerProfileByUserId,
  toFarmerProfileResponse,
  toBuyerProfileResponse
} from '../db/repositories/profileRepository';
import { createSession, revokeSession } from '../db/repositories/sessionRepository';
import { logAuditEvent } from '../db/repositories/auditRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken, hashToken } from '../utils/token';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Registers a new user account (FARMER or BUYER) with associated profile.
 * Public registration does NOT permit ADMIN role.
 */
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      role, 
      // Farmer profile fields
      village, 
      district, 
      state, 
      // Buyer profile fields
      buyerType, 
      organizationName, 
      city 
    } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Full name is required.' },
      });
      return;
    }

    if (!email && !phone) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Either email or phone number is required.' },
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long.' },
      });
      return;
    }

    // Role check: Only FARMER and BUYER allowed for public registration
    const normalizedRole = typeof role === 'string' ? role.toUpperCase() : '';
    if (normalizedRole !== 'FARMER' && normalizedRole !== 'BUYER') {
      res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_ROLE', 
          message: 'Role must be either FARMER or BUYER. Self-registration as ADMIN is strictly prohibited.' 
        },
      });
      return;
    }

    // Location validation
    if (!district || !state) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'District and State are required location fields.' },
      });
      return;
    }

    // 2. Check for duplicate account
    if (email) {
      const existingEmail = await findUserByEmail(email);
      if (existingEmail) {
        res.status(409).json({
          success: false,
          error: { code: 'USER_EXISTS', message: 'An account with this email address already exists.' },
        });
        return;
      }
    }

    if (phone) {
      const existingPhone = await findUserByPhone(phone);
      if (existingPhone) {
        res.status(409).json({
          success: false,
          error: { code: 'USER_EXISTS', message: 'An account with this phone number already exists.' },
        });
        return;
      }
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create user & profile atomically
    let createdUser;
    let farmerProfile = null;
    let buyerProfile = null;

    if (normalizedRole === 'FARMER') {
      const result = await createFarmerUser({
        email,
        phone,
        passwordHash,
        name,
        village,
        district,
        state,
      });
      createdUser = result.user;
      farmerProfile = toFarmerProfileResponse(result.profile);
    } else {
      const result = await createBuyerUser({
        email,
        phone,
        passwordHash,
        name,
        buyerType,
        organizationName,
        city,
        district,
        state,
      });
      createdUser = result.user;
      buyerProfile = toBuyerProfileResponse(result.profile);
    }

    // 5. Generate token and create server session
    const { token, expiresAt } = signToken({
      userId: createdUser.id,
      role: createdUser.role,
    });

    const tokenHash = hashToken(token);
    await createSession(createdUser.id, tokenHash, expiresAt);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: toSafeUser(createdUser),
        farmerProfile,
        buyerProfile,
      },
      message: 'Account registered successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message },
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a verifiable session token.
 */
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginIdentifier = (identifier || email || phone || '').toString().trim();

    if (!loginIdentifier || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email/Phone and password are required.' },
      });
      return;
    }

    // 1. Look up user
    const user = await findUserByIdentifier(loginIdentifier);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid login credentials.' },
      });
      return;
    }

    // 2. Verify account status
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: { 
          code: 'ACCOUNT_SUSPENDED', 
          message: `Your account is ${user.status.toLowerCase()}. Access is restricted.` 
        },
      });
      return;
    }

    // 3. Verify password
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid login credentials.' },
      });
      return;
    }

    // 4. Create signed token and server-side session
    const { token, expiresAt } = signToken({
      userId: user.id,
      role: user.role,
    });

    const tokenHash = hashToken(token);
    await createSession(user.id, tokenHash, expiresAt);

    // 5. Fetch associated profile
    let farmerProfile = null;
    let buyerProfile = null;

    if (user.role === 'FARMER') {
      const fRow = await getFarmerProfileByUserId(user.id);
      if (fRow) farmerProfile = toFarmerProfileResponse(fRow);
    } else if (user.role === 'BUYER') {
      const bRow = await getBuyerProfileByUserId(user.id);
      if (bRow) buyerProfile = toBuyerProfileResponse(bRow);
    }

    // 6. Record audit log
    await logAuditEvent(user.id, 'USER_LOGGED_IN', 'user', user.id, {
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
        farmerProfile,
        buyerProfile,
      },
      message: 'Login successful.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed.';
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message },
    });
  }
});

/**
 * POST /api/auth/logout
 * Server-side session termination.
 * Revokes the session record in the database per Correction 3.
 */
authRouter.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user?.tokenHash) {
      await revokeSession(req.user.tokenHash);
      await logAuditEvent(req.user.id, 'USER_LOGGED_OUT', 'user', req.user.id);
    }

    res.status(200).json({
      success: true,
      data: null,
      message: 'Logged out successfully. Session terminated.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed.';
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_FAILED', message },
    });
  }
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user account and profile.
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
      return;
    }

    let farmerProfile = null;
    let buyerProfile = null;

    if (user.role === 'FARMER') {
      const fRow = await getFarmerProfileByUserId(user.id);
      if (fRow) farmerProfile = toFarmerProfileResponse(fRow);
    } else if (user.role === 'BUYER') {
      const bRow = await getBuyerProfileByUserId(user.id);
      if (bRow) buyerProfile = toBuyerProfileResponse(bRow);
    }

    res.status(200).json({
      success: true,
      data: {
        user: toSafeUser(user),
        farmerProfile,
        buyerProfile,
      },
      message: 'Account details retrieved successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve account details.';
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message },
    });
  }
});
