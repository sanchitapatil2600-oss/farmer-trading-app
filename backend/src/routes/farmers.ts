import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { 
  getFarmerProfileByUserId, 
  updateFarmerProfile, 
  toFarmerProfileResponse 
} from '../db/repositories/profileRepository';
import { logAuditEvent } from '../db/repositories/auditRepository';

export const farmersRouter = Router();

/**
 * GET /api/farmers/me
 * Retrieves profile of the authenticated farmer.
 */
farmersRouter.get('/me', authenticate, requireRole('FARMER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await getFarmerProfileByUserId(userId);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Farmer profile not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: toFarmerProfileResponse(profile),
      message: 'Farmer profile retrieved successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching farmer profile.';
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message },
    });
  }
});

/**
 * PUT /api/farmers/me
 * Updates profile of the authenticated farmer.
 * Exact private address is never exposed or accepted.
 */
farmersRouter.put('/me', authenticate, requireRole('FARMER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, village, district, state, profileImageUrl } = req.body;

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

    const updated = await updateFarmerProfile(userId, {
      name,
      village,
      district,
      state,
      profileImageUrl,
    });

    await logAuditEvent(userId, 'FARMER_PROFILE_UPDATED', 'farmer_profile', updated.id, {
      district: updated.district,
      state: updated.state,
    });

    res.status(200).json({
      success: true,
      data: toFarmerProfileResponse(updated),
      message: 'Farmer profile updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating farmer profile.';
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message },
    });
  }
});
