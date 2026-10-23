import { query } from '../index';
import {
  CreateOfferInput,
  OfferResponse,
  OfferRow,
  OfferStatus,
} from '../../types/offer';

export function toOfferResponse(
  row: OfferRow,
  enriched?: {
    cropName?: string;
    unit?: string;
    buyerName?: string;
    farmerId?: string;
    farmerName?: string;
  }
): OfferResponse {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    offeredPrice: Number(row.offered_price),
    quantity: Number(row.quantity),
    message: row.message,
    status: row.status,
    expirationReason: row.expiration_reason,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    cropName: enriched?.cropName,
    unit: enriched?.unit,
    buyerName: enriched?.buyerName,
    farmerId: enriched?.farmerId,
    farmerName: enriched?.farmerName,
  };
}

export async function createOffer(
  input: CreateOfferInput
): Promise<OfferResponse> {
  const result = await query<OfferRow>(
    `INSERT INTO offers (
       listing_id,
       buyer_id,
       offered_price,
       quantity,
       message,
       status
     )
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
     RETURNING *`,
    [
      input.listingId,
      input.buyerId,
      input.offeredPrice,
      input.quantity,
      input.message?.trim() || null,
    ]
  );

  return toOfferResponse(result.rows[0]);
}

export async function findOfferById(
  id: string
): Promise<OfferResponse | null> {
  const result = await query<OfferRow & {
    crop_name?: string;
    unit?: string;
    buyer_name?: string;
    farmer_id?: string;
    farmer_name?: string;
  }>(
    `SELECT o.*,
            p.crop_name,
            p.unit,
            p.farmer_id,
            bp.name AS buyer_name,
            fp.name AS farmer_name
     FROM offers o
     JOIN produce_listings p ON p.id = o.listing_id
     LEFT JOIN buyer_profiles bp ON bp.user_id = o.buyer_id
     LEFT JOIN farmer_profiles fp ON fp.user_id = p.farmer_id
     WHERE o.id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return toOfferResponse(row, {
    cropName: row.crop_name,
    unit: row.unit,
    buyerName: row.buyer_name,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
  });
}

export async function findOffersByListingId(
  listingId: string
): Promise<OfferResponse[]> {
  const result = await query<OfferRow & {
    crop_name?: string;
    unit?: string;
    buyer_name?: string;
    farmer_id?: string;
    farmer_name?: string;
  }>(
    `SELECT o.*,
            p.crop_name,
            p.unit,
            p.farmer_id,
            bp.name AS buyer_name,
            fp.name AS farmer_name
     FROM offers o
     JOIN produce_listings p ON p.id = o.listing_id
     LEFT JOIN buyer_profiles bp ON bp.user_id = o.buyer_id
     LEFT JOIN farmer_profiles fp ON fp.user_id = p.farmer_id
     WHERE o.listing_id = $1
     ORDER BY o.created_at DESC`,
    [listingId]
  );

  return result.rows.map((row) =>
    toOfferResponse(row, {
      cropName: row.crop_name,
      unit: row.unit,
      buyerName: row.buyer_name,
      farmerId: row.farmer_id,
      farmerName: row.farmer_name,
    })
  );
}

export async function findOffersByBuyerId(
  buyerId: string
): Promise<OfferResponse[]> {
  const result = await query<OfferRow & {
    crop_name?: string;
    unit?: string;
    buyer_name?: string;
    farmer_id?: string;
    farmer_name?: string;
  }>(
    `SELECT o.*,
            p.crop_name,
            p.unit,
            p.farmer_id,
            bp.name AS buyer_name,
            fp.name AS farmer_name
     FROM offers o
     JOIN produce_listings p ON p.id = o.listing_id
     LEFT JOIN buyer_profiles bp ON bp.user_id = o.buyer_id
     LEFT JOIN farmer_profiles fp ON fp.user_id = p.farmer_id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC`,
    [buyerId]
  );

  return result.rows.map((row) =>
    toOfferResponse(row, {
      cropName: row.crop_name,
      unit: row.unit,
      buyerName: row.buyer_name,
      farmerId: row.farmer_id,
      farmerName: row.farmer_name,
    })
  );
}

export async function withdrawOffer(
  offerId: string,
  buyerId: string
): Promise<OfferResponse | null> {
  const result = await query<OfferRow>(
    `UPDATE offers
     SET status = 'WITHDRAWN', updated_at = NOW()
     WHERE id = $1 AND buyer_id = $2 AND status = 'ACTIVE'
     RETURNING *`,
    [offerId, buyerId]
  );

  return result.rows[0] ? toOfferResponse(result.rows[0]) : null;
}

export async function rejectOffer(
  offerId: string,
  farmerId: string
): Promise<OfferResponse | null> {
  const result = await query<OfferRow>(
    `UPDATE offers o
     SET status = 'REJECTED', updated_at = NOW()
     FROM produce_listings p
     WHERE o.id = $1
       AND o.listing_id = p.id
       AND p.farmer_id = $2
       AND o.status = 'ACTIVE'
     RETURNING o.*`,
    [offerId, farmerId]
  );

  return result.rows[0] ? toOfferResponse(result.rows[0]) : null;
}
