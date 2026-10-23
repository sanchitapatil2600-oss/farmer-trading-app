import { Router, Request, Response } from 'express';
import {
  authenticate,
  requireRole,
} from '../middleware/auth';
import {
  createProduceListing,
  deleteProduceListing,
  findMarketplaceListings,
  findProduceListingById,
  findProduceListingsByFarmer,
  updateProduceListing,
} from '../db/repositories/produceRepository';
import {
  isPositiveNumber,
  isValidDateString,
  isValidProduceStatus,
  isValidProduceUnit,
  isValidUuid,
} from '../utils/produceValidation';
import {
  ProduceListingStatus,
  ProduceUnit,
} from '../types/produce';
import { logAuditEvent } from '../db/repositories/auditRepository';

export const listingsRouter = Router();

function sendValidationError(
  res: Response,
  message: string
): void {
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
    },
  });
}

/**
 * POST /api/listings
 *
 * Creates a new produce listing for the authenticated farmer.
 */
listingsRouter.post(
  '/',
  authenticate,
  requireRole('FARMER'),
  async (req: Request, res: Response) => {
    try {
      const {
        cropName,
        description,
        quantity,
        unit,
        expectedPricePerUnit,
        availabilityDate,
        village,
        district,
        state,
        imageUrl,
      } = req.body;

      if (
        typeof cropName !== 'string' ||
        cropName.trim().length === 0
      ) {
        sendValidationError(
          res,
          'Crop name is required.'
        );
        return;
      }

      if (cropName.trim().length > 100) {
        sendValidationError(
          res,
          'Crop name cannot exceed 100 characters.'
        );
        return;
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== 'string'
      ) {
        sendValidationError(
          res,
          'Description must be text.'
        );
        return;
      }

      if (!isPositiveNumber(quantity)) {
        sendValidationError(
          res,
          'Quantity must be a positive number.'
        );
        return;
      }

      const normalizedUnit = typeof unit === 'string' ? unit.trim().toUpperCase() : unit;
      if (!isValidProduceUnit(normalizedUnit)) {
        sendValidationError(
          res,
          'Invalid produce unit.'
        );
        return;
      }

      if (!isPositiveNumber(expectedPricePerUnit)) {
        sendValidationError(
          res,
          'Expected price must be a positive number.'
        );
        return;
      }

      if (!isValidDateString(availabilityDate)) {
        sendValidationError(
          res,
          'Availability date must use YYYY-MM-DD format.'
        );
        return;
      }

      if (
        typeof district !== 'string' ||
        district.trim().length === 0
      ) {
        sendValidationError(
          res,
          'District is required.'
        );
        return;
      }

      if (
        typeof state !== 'string' ||
        state.trim().length === 0
      ) {
        sendValidationError(
          res,
          'State is required.'
        );
        return;
      }

      if (
        village !== undefined &&
        village !== null &&
        typeof village !== 'string'
      ) {
        sendValidationError(
          res,
          'Village must be text.'
        );
        return;
      }

      if (
        imageUrl !== undefined &&
        imageUrl !== null &&
        typeof imageUrl !== 'string'
      ) {
        sendValidationError(
          res,
          'Image URL must be text.'
        );
        return;
      }

      const listing =
        await createProduceListing({
          farmerId: req.user!.id,
          cropName,
          description,
          quantity,
          unit: normalizedUnit as ProduceUnit,
          expectedPricePerUnit,
          availabilityDate,
          village,
          district,
          state,
          imageUrl,
        });

      await logAuditEvent(
        req.user!.id,
        'PRODUCE_LISTING_CREATED',
        'produce_listing',
        listing.id,
        {
          cropName: listing.cropName,
          quantity: listing.quantity,
          unit: listing.unit,
          district: listing.district,
        }
      );

      res.status(201).json({
        success: true,
        data: listing,
        message: 'Produce listing created successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error creating produce listing.';

      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message,
        },
      });
    }
  }
);

/**
 * GET /api/listings
 *
 * Public marketplace listing endpoint.
 * Authentication is not required.
 */
listingsRouter.get(
  '/',
  async (req: Request, res: Response) => {
    try {
      const search =
        typeof req.query.search === 'string'
          ? req.query.search
          : undefined;

      const district =
        typeof req.query.district === 'string'
          ? req.query.district
          : undefined;

      const status =
        typeof req.query.status === 'string'
          ? req.query.status
          : undefined;

      const pageValue =
        typeof req.query.page === 'string'
          ? Number(req.query.page)
          : 1;

      const limitValue =
        typeof req.query.limit === 'string'
          ? Number(req.query.limit)
          : 12;

      if (
        !Number.isInteger(pageValue) ||
        pageValue < 1
      ) {
        sendValidationError(
          res,
          'Page must be a positive integer.'
        );
        return;
      }

      if (
        !Number.isInteger(limitValue) ||
        limitValue < 1 ||
        limitValue > 50
      ) {
        sendValidationError(
          res,
          'Limit must be between 1 and 50.'
        );
        return;
      }

      let listingStatus:
        | ProduceListingStatus
        | undefined;

      if (status !== undefined) {
        if (!isValidProduceStatus(status)) {
          sendValidationError(
            res,
            'Invalid listing status.'
          );
          return;
        }

        listingStatus =
          status as ProduceListingStatus;
      }

      const result =
        await findMarketplaceListings({
          search,
          district,
          status: listingStatus,
          page: pageValue,
          limit: limitValue,
        });

      res.status(200).json({
        success: true,
        data: result.listings,
        pagination: result.pagination,
        message: 'Produce listings retrieved successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error fetching produce listings.';

      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
        },
      });
    }
  }
);

/**
 * GET /api/listings/my
 *
 * Retrieves listings owned by the authenticated farmer.
 */
listingsRouter.get(
  '/my',
  authenticate,
  requireRole('FARMER'),
  async (req: Request, res: Response) => {
    try {
      const listings =
        await findProduceListingsByFarmer(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: listings,
        message: 'Your produce listings retrieved successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error fetching your listings.';

      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
        },
      });
    }
  }
);

/**
 * GET /api/listings/:id
 *
 * Retrieves one marketplace listing.
 */
listingsRouter.get(
  '/:id',
  async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid listing ID format.');
        return;
      }

      const listing =
        await findProduceListingById(
          req.params.id
        );

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

      res.status(200).json({
        success: true,
        data: listing,
        message: 'Produce listing retrieved successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error fetching produce listing.';

      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
        },
      });
    }
  }
);

/**
 * PATCH /api/listings/:id
 *
 * Updates an existing listing.
 * Only the owning farmer can update it.
 */
listingsRouter.patch(
  '/:id',
  authenticate,
  requireRole('FARMER'),
  async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid listing ID format.');
        return;
      }

      const existing =
        await findProduceListingById(
          req.params.id
        );

      if (!existing) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produce listing not found.',
          },
        });
        return;
      }

      if (existing.farmerId !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message:
              'You can only modify your own produce listings.',
          },
        });
        return;
      }

      const {
        cropName,
        description,
        quantity,
        unit,
        expectedPricePerUnit,
        availabilityDate,
        village,
        district,
        state,
        imageUrl,
        status,
      } = req.body;

      if (
        cropName !== undefined &&
        (
          typeof cropName !== 'string' ||
          cropName.trim().length === 0 ||
          cropName.trim().length > 100
        )
      ) {
        sendValidationError(
          res,
          'Crop name must be a non-empty string of at most 100 characters.'
        );
        return;
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== 'string'
      ) {
        sendValidationError(
          res,
          'Description must be text.'
        );
        return;
      }

      if (
        quantity !== undefined &&
        !isPositiveNumber(quantity)
      ) {
        sendValidationError(
          res,
          'Quantity must be a positive number.'
        );
        return;
      }

      let normalizedUnit: ProduceUnit | undefined;
      if (unit !== undefined) {
        const upper = typeof unit === 'string' ? unit.trim().toUpperCase() : unit;
        if (!isValidProduceUnit(upper)) {
          sendValidationError(
            res,
            'Invalid produce unit.'
          );
          return;
        }
        normalizedUnit = upper as ProduceUnit;
      }

      if (
        expectedPricePerUnit !== undefined &&
        !isPositiveNumber(expectedPricePerUnit)
      ) {
        sendValidationError(
          res,
          'Expected price must be a positive number.'
        );
        return;
      }

      if (
        availabilityDate !== undefined &&
        !isValidDateString(availabilityDate)
      ) {
        sendValidationError(
          res,
          'Availability date must use YYYY-MM-DD format.'
        );
        return;
      }

      if (
        district !== undefined &&
        (
          typeof district !== 'string' ||
          district.trim().length === 0
        )
      ) {
        sendValidationError(
          res,
          'District cannot be empty.'
        );
        return;
      }

      if (
        state !== undefined &&
        (
          typeof state !== 'string' ||
          state.trim().length === 0
        )
      ) {
        sendValidationError(
          res,
          'State cannot be empty.'
        );
        return;
      }

      if (
        village !== undefined &&
        village !== null &&
        typeof village !== 'string'
      ) {
        sendValidationError(
          res,
          'Village must be text.'
        );
        return;
      }

      if (
        imageUrl !== undefined &&
        imageUrl !== null &&
        typeof imageUrl !== 'string'
      ) {
        sendValidationError(
          res,
          'Image URL must be text.'
        );
        return;
      }

      if (
        status !== undefined &&
        !isValidProduceStatus(status)
      ) {
        sendValidationError(
          res,
          'Invalid listing status.'
        );
        return;
      }

      const updated =
        await updateProduceListing(
          req.params.id,
          {
            cropName,
            description,
            quantity,
            unit: normalizedUnit,
            expectedPricePerUnit,
            availabilityDate,
            village,
            district,
            state,
            imageUrl,
            status,
          }
        );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produce listing not found.',
          },
        });
        return;
      }

      await logAuditEvent(
        req.user!.id,
        'PRODUCE_LISTING_UPDATED',
        'produce_listing',
        updated.id,
        {
          cropName: updated.cropName,
          status: updated.status,
        }
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Produce listing updated successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error updating produce listing.';

      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message,
        },
      });
    }
  }
);

/**
 * DELETE /api/listings/:id
 *
 * Deletes an existing listing.
 * Only the owning farmer can delete it.
 */
listingsRouter.delete(
  '/:id',
  authenticate,
  requireRole('FARMER'),
  async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      if (!isValidUuid(req.params.id)) {
        sendValidationError(res, 'Invalid listing ID format.');
        return;
      }

      const existing =
        await findProduceListingById(
          req.params.id
        );

      if (!existing) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produce listing not found.',
          },
        });
        return;
      }

      if (existing.farmerId !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message:
              'You can only delete your own produce listings.',
          },
        });
        return;
      }

      const deleted =
        await deleteProduceListing(
          req.params.id
        );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produce listing not found.',
          },
        });
        return;
      }

      await logAuditEvent(
        req.user!.id,
        'PRODUCE_LISTING_DELETED',
        'produce_listing',
        existing.id,
        {
          cropName: existing.cropName,
          district: existing.district,
        }
      );

      res.status(200).json({
        success: true,
        data: null,
        message: 'Produce listing deleted successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error deleting produce listing.';

      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message,
        },
      });
    }
  }
);