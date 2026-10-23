import { query, withTransaction } from '../index';
import {
  DealResponse,
  DealRow,
  DealStatus,
} from '../../types/deal';
import { OfferResponse, OfferRow } from '../../types/offer';
import { ProduceListingRow } from '../../types/produce';
import { toOfferResponse } from './offerRepository';

export function toDealResponse(
  row: DealRow,
  enriched?: {
    cropName?: string;
    unit?: string;
    farmerName?: string;
    buyerName?: string;
    originDistrict?: string;
    destinationDistrict?: string;
  }
): DealResponse {
  return {
    id: row.id,
    listingId: row.listing_id,
    farmerId: row.farmer_id,
    buyerId: row.buyer_id,
    acceptedOfferId: row.accepted_offer_id,
    quantity: Number(row.quantity),
    agreedPrice: Number(row.agreed_price),
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    cropName: enriched?.cropName,
    unit: enriched?.unit,
    farmerName: enriched?.farmerName,
    buyerName: enriched?.buyerName,
    originDistrict: enriched?.originDistrict,
    destinationDistrict: enriched?.destinationDistrict,
  };
}

export async function findDealById(id: string): Promise<DealResponse | null> {
  const result = await query<DealRow & {
    crop_name?: string;
    unit?: string;
    farmer_name?: string;
    buyer_name?: string;
    origin_district?: string;
    destination_district?: string;
  }>(
    `SELECT d.*,
            p.crop_name,
            p.unit,
            p.district AS origin_district,
            fp.name AS farmer_name,
            bp.name AS buyer_name,
            bp.district AS destination_district
     FROM deals d
     JOIN produce_listings p ON p.id = d.listing_id
     LEFT JOIN farmer_profiles fp ON fp.user_id = d.farmer_id
     LEFT JOIN buyer_profiles bp ON bp.user_id = d.buyer_id
     WHERE d.id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return toDealResponse(row, {
    cropName: row.crop_name,
    unit: row.unit,
    farmerName: row.farmer_name,
    buyerName: row.buyer_name,
    originDistrict: row.origin_district,
    destinationDistrict: row.destination_district,
  });
}

export async function findDealsByUserId(
  userId: string,
  role?: string
): Promise<DealResponse[]> {
  const isFarmer = role === 'FARMER';
  const isBuyer = role === 'BUYER';

  let whereClause = `WHERE d.farmer_id = $1 OR d.buyer_id = $1`;
  if (isFarmer) {
    whereClause = `WHERE d.farmer_id = $1`;
  } else if (isBuyer) {
    whereClause = `WHERE d.buyer_id = $1`;
  }

  const result = await query<DealRow & {
    crop_name?: string;
    unit?: string;
    farmer_name?: string;
    buyer_name?: string;
    origin_district?: string;
    destination_district?: string;
  }>(
    `SELECT d.*,
            p.crop_name,
            p.unit,
            p.district AS origin_district,
            fp.name AS farmer_name,
            bp.name AS buyer_name,
            bp.district AS destination_district
     FROM deals d
     JOIN produce_listings p ON p.id = d.listing_id
     LEFT JOIN farmer_profiles fp ON fp.user_id = d.farmer_id
     LEFT JOIN buyer_profiles bp ON bp.user_id = d.buyer_id
     ${whereClause}
     ORDER BY d.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) =>
    toDealResponse(row, {
      cropName: row.crop_name,
      unit: row.unit,
      farmerName: row.farmer_name,
      buyerName: row.buyer_name,
      originDistrict: row.origin_district,
      destinationDistrict: row.destination_district,
    })
  );
}

export async function getDealStatus(id: string): Promise<{
  id: string;
  status: DealStatus;
  totalAmount: number;
  currency: string;
  updatedAt: string;
} | null> {
  const result = await query<{
    id: string;
    status: DealStatus;
    total_amount: string;
    currency: string;
    updated_at: Date;
  }>(
    `SELECT id, status, total_amount, currency, updated_at
     FROM deals
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    status: row.status,
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    updatedAt: row.updated_at.toISOString(),
  };
}

export interface AcceptOfferResult {
  deal: DealResponse;
  acceptedOffer: OfferResponse;
  remainingListingQuantity: number;
  listingStatus: 'ACTIVE' | 'SOLD_OUT';
  expiredOfferCount: number;
}

/**
 * CRITICAL ACCEPT-OFFER TRANSACTION:
 * Atomically locks rows, validates states, deducts inventory, auto-expires competing
 * active offers requesting more than remaining quantity, updates offer to ACCEPTED,
 * creates deal with CONFIRMED status, and records audit logs.
 */
export async function acceptOfferAndCreateDeal(
  offerId: string,
  farmerId: string
): Promise<AcceptOfferResult> {
  return withTransaction(async (client) => {
    // 1. Look up the offer to identify its associated listing
    const initialOffer = await client.query<{ listing_id: string }>(
      `SELECT listing_id FROM offers WHERE id = $1`,
      [offerId]
    );

    if (initialOffer.rows.length === 0) {
      throw new Error('OFFER_NOT_FOUND: Offer does not exist.');
    }

    const listingId = initialOffer.rows[0].listing_id;

    // 2. Lock the associated listing row FIRST (FOR UPDATE)
    // Consistent listing -> offer lock hierarchy prevents deadlocks with competing offer expiration
    const listingRes = await client.query<ProduceListingRow>(
      `SELECT * FROM produce_listings WHERE id = $1 FOR UPDATE`,
      [listingId]
    );

    if (listingRes.rows.length === 0) {
      throw new Error('LISTING_NOT_FOUND: Associated produce listing not found.');
    }

    const listing = listingRes.rows[0];

    // 3. Lock the target offer row SECOND (FOR UPDATE)
    const offerRes = await client.query<OfferRow>(
      `SELECT * FROM offers WHERE id = $1 FOR UPDATE`,
      [offerId]
    );

    if (offerRes.rows.length === 0) {
      throw new Error('OFFER_NOT_FOUND: Offer does not exist.');
    }

    const offer = offerRes.rows[0];

    // 4. Verify authenticated user owns the listing as FARMER
    if (listing.farmer_id !== farmerId) {
      throw new Error('FORBIDDEN: You do not own this produce listing.');
    }

    // 5. Verify user has FARMER role
    const userRes = await client.query<{ role: string }>(
      `SELECT role FROM users WHERE id = $1`,
      [farmerId]
    );
    if (!userRes.rows[0] || userRes.rows[0].role !== 'FARMER') {
      throw new Error('FORBIDDEN: Only farmers can accept offers.');
    }

    // 6. Verify buyer and farmer are different users
    if (offer.buyer_id === farmerId) {
      throw new Error('INVALID_TRANSACTION: Farmer and buyer cannot be the same account.');
    }

    // 7. Verify offer is ACTIVE
    if (offer.status !== 'ACTIVE') {
      throw new Error(`OFFER_NOT_ACTIVE: Offer is ${offer.status}, only ACTIVE offers can be accepted.`);
    }

    // 8. Verify listing is ACTIVE
    if (listing.status !== 'ACTIVE') {
      throw new Error('LISTING_NOT_ACTIVE: This produce listing is no longer active.');
    }

    // 8. Verify requested quantity <= remaining listing quantity
    const currentListingQty = Number(listing.quantity);
    const offerQty = Number(offer.quantity);
    const agreedPrice = Number(offer.offered_price);

    if (offerQty <= 0) {
      throw new Error('INVALID_QUANTITY: Offer quantity must be greater than zero.');
    }

    if (offerQty > currentListingQty) {
      throw new Error(
        `INSUFFICIENT_QUANTITY: Requested quantity (${offerQty}) exceeds remaining listing quantity (${currentListingQty}).`
      );
    }

    // 9. Atomically deduct accepted quantity
    const remainingQty = Math.round((currentListingQty - offerQty) * 100) / 100;
    const newListingStatus: 'ACTIVE' | 'SOLD_OUT' = remainingQty === 0 ? 'SOLD_OUT' : 'ACTIVE';

    await client.query(
      `UPDATE produce_listings
       SET quantity = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [remainingQty, newListingStatus, listing.id]
    );

    // 10. Mark accepted offer ACCEPTED
    const updatedOfferRes = await client.query<OfferRow>(
      `UPDATE offers
       SET status = 'ACCEPTED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [offer.id]
    );

    // 11. Expire competing ACTIVE offers whose requested quantity is greater than remaining quantity
    const expireRes = await client.query(
      `UPDATE offers
       SET status = 'EXPIRED',
           expiration_reason = 'Insufficient remaining quantity',
           updated_at = NOW()
       WHERE listing_id = $1
         AND id != $2
         AND status = 'ACTIVE'
         AND quantity > $3`,
      [listing.id, offer.id, remainingQty]
    );
    const expiredCount = expireRes.rowCount ?? 0;

    // 12. Calculate total_amount server-side: quantity * agreed_price
    const totalAmount = Math.round(offerQty * agreedPrice * 100) / 100;

    // 13. Create exactly one deal for accepted offer (status CONFIRMED)
    const dealRes = await client.query<DealRow>(
      `INSERT INTO deals (
         listing_id,
         farmer_id,
         buyer_id,
         accepted_offer_id,
         quantity,
         agreed_price,
         total_amount,
         currency,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR', 'CONFIRMED')
       RETURNING *`,
      [
        listing.id,
        farmerId,
        offer.buyer_id,
        offer.id,
        offerQty,
        agreedPrice,
        totalAmount,
      ]
    );

    const deal = dealRes.rows[0];

    // 14. Write audit events: OFFER_ACCEPTED and DEAL_CREATED
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'OFFER_ACCEPTED', 'offer', $2, $3)`,
      [
        farmerId,
        offer.id,
        JSON.stringify({
          listingId: listing.id,
          dealId: deal.id,
          quantity: offerQty,
          agreedPrice,
          remainingListingQuantity: remainingQty,
          listingStatus: newListingStatus,
          expiredOfferCount: expiredCount,
        }),
      ]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'DEAL_CREATED', 'deal', $2, $3)`,
      [
        farmerId,
        deal.id,
        JSON.stringify({
          listingId: listing.id,
          offerId: offer.id,
          buyerId: offer.buyer_id,
          farmerId,
          quantity: offerQty,
          agreedPrice,
          totalAmount,
          currency: 'INR',
          status: 'CONFIRMED',
        }),
      ]
    );

    return {
      deal: toDealResponse(deal),
      acceptedOffer: toOfferResponse(updatedOfferRes.rows[0]),
      remainingListingQuantity: remainingQty,
      listingStatus: newListingStatus,
      expiredOfferCount: expiredCount,
    };
  });
}
