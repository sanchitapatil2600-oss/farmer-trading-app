import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { 
  getBuyerProfileByUserId, 
  updateBuyerProfile, 
  toBuyerProfileResponse 
} from '../db/repositories/profileRepository';
import { logAuditEvent } from '../db/repositories/auditRepository';

export const buyersRouter = Router();

/**
 * GET /api/buyers/me
 * Retrieves profile of the authenticated buyer.
 */
buyersRouter.get('/me', authenticate, requireRole('BUYER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await getBuyerProfileByUserId(userId);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Buyer profile not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: toBuyerProfileResponse(profile),
      message: 'Buyer profile retrieved successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching buyer profile.';
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message },
    });
  }
});

/**
 * PUT /api/buyers/me
 * Updates profile of the authenticated buyer.
 */
buyersRouter.put('/me', authenticate, requireRole('BUYER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, buyerType, organizationName, city, district, state } = req.body;

    // Validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name cannot be empty.' },
      });
      return;
    }

    if (district !== undefined && (typeof district !== 'string' || district.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'District cannot be empty.' },
      });
      return;
    }

    if (state !== undefined && (typeof state !== 'string' || state.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'State cannot be empty.' },
      });
      return;
    }

    const updated = await updateBuyerProfile(userId, {
      name,
      buyerType,
      organizationName,
      city,
      district,
      state,
    });

    await logAuditEvent(userId, 'BUYER_PROFILE_UPDATED', 'buyer_profile', updated.id, {
      buyerType: updated.buyer_type,
      district: updated.district,
      state: updated.state,
    });

    res.status(200).json({
      success: true,
      data: toBuyerProfileResponse(updated),
      message: 'Buyer profile updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating buyer profile.';
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message },
    });
  }
});
