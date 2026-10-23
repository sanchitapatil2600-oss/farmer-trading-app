import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { offerRateLimiter } from '../middleware/rateLimiter';
import { isValidUuid } from '../utils/produceValidation';
import { isValidPriceOrQuantity } from '../utils/offerValidation';
import { findProduceListingById } from '../db/repositories/produceRepository';
import {
  createOffer,
  findOfferById,
  findOffersByBuyerId,
  findOffersByListingId,
  rejectOffer,
  withdrawOffer,
} from '../db/repositories/offerRepository';
import { acceptOfferAndCreateDeal } from '../db/repositories/dealRepository';
import { logAuditEvent } from '../db/repositories/auditRepository';

export const offersRouter = Router();
export const listingOffersRouter = Router({ mergeParams: true });

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
 * POST /api/listings/:id/offers
 * Submits an offer on a produce listing.
 * Authenticated BUYER only.
 */
listingOffersRouter.post(
  '/',
  authenticate,
  requireRole('BUYER'),
  offerRateLimiter,
  async (req: Request<{ id?: string; listingId?: string }>, res: Response) => {
    try {
      const listingId = req.params.id || req.params.listingId;
      if (!listingId || !isValidUuid(listingId)) {
        sendValidationError(res, 'Invalid listing ID format.');
        return;
      }

      const { offeredPrice, quantity, message } = req.body;

      if (!isValidPriceOrQuantity(offeredPrice)) {
        sendValidationError(res, 'Offered price must be a positive number.');
        return;
      }

      if (!isValidPriceOrQuantity(quantity)) {
        sendValidationError(res, 'Quantity must be a positive number.');
        return;
      }

      if (message !== undefined && message !== null && typeof message !== 'string') {
        sendValidationError(res, 'Message must be text.');
        return;
      }

      const listing = await findProduceListingById(listingId);
      if (!listing) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produce listing not found.',
          },
        });
        return;
      }

      if (listing.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          error: {
            code: 'LISTING_NOT_ACTIVE',
            message: 'Cannot make an offer on an inactive or sold-out listing.',
          },
        });
        return;
      }

      if (listing.farmerId === req.user!.id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OFFER',
            message: 'You cannot submit an offer on your own produce listing.',
          },
        });
        return;
      }

      if (quantity > listing.quantity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_QUANTITY',
            message: `Offered quantity (${quantity}) exceeds currently available quantity (${listing.quantity}).`,
          },
        });
        return;
      }

      const offer = await createOffer({
        listingId,
        buyerId: req.user!.id,
        offeredPrice: Number(offeredPrice),
        quantity: Number(quantity),
        message,
      });

      await logAuditEvent(req.user!.id, 'OFFER_CREATED', 'offer', offer.id, {
        listingId,
        offeredPrice: offer.offeredPrice,
        quantity: offer.quantity,
      });

      res.status(201).json({
        success: true,
        data: offer,
        message: 'Offer submitted successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating offer.';
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: msg,
        },
      });
    }
  }
);

/**
 * GET /api/listings/:id/offers
 * Retrieves offers for a specific listing.
 * Authenticated owning FARMER or ADMIN only.
 */
listingOffersRouter.get(
  '/',
  authenticate,
  requireRole('FARMER', 'ADMIN'),
  async (req: Request<{ id?: string; listingId?: string }>, res: Response) => {
    try {
      const listingId = req.params.id || req.params.listingId;
      if (!listingId || !isValidUuid(listingId)) {
        sendValidationError(res, 'Invalid listing ID format.');
        return;
      }

      const listing = await findProduceListingById(listingId);
      if (!listing) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produce listing not found.',
          },
        });
        return;
      }

      if (req.user!.role !== 'ADMIN' && listing.farmerId !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view offers for your own produce listings.',
          },
        });
        return;
      }

      const offers = await findOffersByListingId(listingId);

      res.status(200).json({
        success: true,
        data: offers,
        message: 'Offers retrieved successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching offers.';
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

/**
 * GET /api/offers/my
 * Retrieves offers submitted by the authenticated buyer.
 * Authenticated BUYER only.
 */
offersRouter.get(
  '/my',
  authenticate,
  requireRole('BUYER'),
  async (req: Request, res: Response) => {
    try {
      const offers = await findOffersByBuyerId(req.user!.id);

      res.status(200).json({
        success: true,
        data: offers,
        message: 'Your offers retrieved successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching your offers.';
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

/**
 * POST /api/offers/:id/withdraw
 * Withdraws an active offer submitted by the authenticated buyer.
 * Authenticated BUYER only.
 */
offersRouter.post(
  '/:id/withdraw',
  authenticate,
  requireRole('BUYER'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid offer ID format.');
        return;
      }

      const offer = await findOfferById(req.params.id);
      if (!offer) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Offer not found.',
          },
        });
        return;
      }

      if (offer.buyerId !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only withdraw your own offers.',
          },
        });
        return;
      }

      if (offer.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot withdraw offer with status ${offer.status}. Only ACTIVE offers can be withdrawn.`,
          },
        });
        return;
      }

      const updated = await withdrawOffer(offer.id, req.user!.id);
      if (!updated) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WITHDRAW_FAILED',
            message: 'Failed to withdraw offer.',
          },
        });
        return;
      }

      await logAuditEvent(req.user!.id, 'OFFER_WITHDRAWN', 'offer', updated.id, {
        listingId: updated.listingId,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Offer withdrawn successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error withdrawing offer.';
      res.status(500).json({
        success: false,
        error: {
          code: 'WITHDRAW_ERROR',
          message: msg,
        },
      });
    }
  }
);

/**
 * POST /api/offers/:id/reject
 * Rejects an active offer on the farmer's listing.
 * Authenticated owning FARMER only.
 */
offersRouter.post(
  '/:id/reject',
  authenticate,
  requireRole('FARMER'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid offer ID format.');
        return;
      }

      const offer = await findOfferById(req.params.id);
      if (!offer) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Offer not found.',
          },
        });
        return;
      }

      const listing = await findProduceListingById(offer.listingId);
      if (!listing || listing.farmerId !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only reject offers on your own produce listings.',
          },
        });
        return;
      }

      if (offer.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot reject offer with status ${offer.status}. Only ACTIVE offers can be rejected.`,
          },
        });
        return;
      }

      const updated = await rejectOffer(offer.id, req.user!.id);
      if (!updated) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REJECT_FAILED',
            message: 'Failed to reject offer.',
          },
        });
        return;
      }

      await logAuditEvent(req.user!.id, 'OFFER_REJECTED', 'offer', updated.id, {
        listingId: updated.listingId,
        buyerId: updated.buyerId,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Offer rejected successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rejecting offer.';
      res.status(500).json({
        success: false,
        error: {
          code: 'REJECT_ERROR',
          message: msg,
        },
      });
    }
  }
);

/**
 * POST /api/offers/:id/accept
 * Accepts an active offer and atomically executes the deal creation transaction.
 * Authenticated owning FARMER only.
 */
offersRouter.post(
  '/:id/accept',
  authenticate,
  requireRole('FARMER'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid offer ID format.');
        return;
      }

      const result = await acceptOfferAndCreateDeal(req.params.id, req.user!.id);

      res.status(200).json({
        success: true,
        data: {
          deal: result.deal,
          acceptedOffer: result.acceptedOffer,
          remainingListingQuantity: result.remainingListingQuantity,
          listingStatus: result.listingStatus,
          expiredOfferCount: result.expiredOfferCount,
        },
        message: 'Offer accepted and deal confirmed successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accepting offer.';

      if (msg.startsWith('OFFER_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: msg.replace(/^OFFER_NOT_FOUND:\s*/, '') },
        });
        return;
      }

      if (msg.startsWith('LISTING_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: msg.replace(/^LISTING_NOT_FOUND:\s*/, '') },
        });
        return;
      }

      if (msg.startsWith('FORBIDDEN')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: msg.replace(/^FORBIDDEN:\s*/, '') },
        });
        return;
      }

      if (
        msg.startsWith('LISTING_NOT_ACTIVE') ||
        msg.startsWith('OFFER_NOT_ACTIVE') ||
        msg.startsWith('INSUFFICIENT_QUANTITY') ||
        msg.startsWith('INVALID_QUANTITY') ||
        msg.startsWith('INVALID_TRANSACTION')
      ) {
        const code = msg.split(':')[0].trim();
        res.status(400).json({
          success: false,
          error: { code, message: msg.replace(/^[^:]+:\s*/, '') },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'ACCEPT_ERROR',
          message: msg,
        },
      });
    }
  }
);
