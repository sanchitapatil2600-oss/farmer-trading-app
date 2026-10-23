import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { isValidUuid } from '../utils/produceValidation';
import {
  findDealById,
  findDealsByUserId,
  getDealStatus,
} from '../db/repositories/dealRepository';

export const dealsRouter = Router();

function sendValidationError(res: Response, message: string): void {
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
    },
  });
}

/**
 * GET /api/deals
 * Retrieves deals accessible to the authenticated user.
 */
dealsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const deals = await findDealsByUserId(req.user!.id, req.user!.role);

    res.status(200).json({
      success: true,
      data: deals,
      message: 'Deals retrieved successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching deals.';
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: msg,
      },
    });
  }
});

/**
 * GET /api/deals/:id
 * Retrieves details of a specific deal.
 * Only the participating farmer, participating buyer, or an ADMIN can view details.
 */
dealsRouter.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!isValidUuid(req.params.id)) {
      sendValidationError(res, 'Invalid deal ID format.');
      return;
    }

    const deal = await findDealById(req.params.id);
    if (!deal) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Deal not found.',
        },
      });
      return;
    }

    const isParticipant =
      deal.farmerId === req.user!.id || deal.buyerId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isParticipant && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this deal.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: deal,
      message: 'Deal retrieved successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching deal.';
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: msg,
      },
    });
  }
});

/**
 * GET /api/deals/:id/status
 * Returns current deal status.
 * Accessible only to participants or admin.
 */
dealsRouter.get(
  '/:id/status',
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid deal ID format.');
        return;
      }

      const deal = await findDealById(req.params.id);
      if (!deal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deal not found.',
          },
        });
        return;
      }

      const isParticipant =
        deal.farmerId === req.user!.id || deal.buyerId === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isParticipant && !isAdmin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this deal status.',
          },
        });
        return;
      }

      const statusInfo = await getDealStatus(req.params.id);

      res.status(200).json({
        success: true,
        data: statusInfo,
        message: 'Deal status retrieved successfully.',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error fetching deal status.';
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: msg,
        },
      });
    }
  }
);
