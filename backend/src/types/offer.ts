export type OfferStatus =
  | 'ACTIVE'
  | 'WITHDRAWN'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface OfferRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  offered_price: string;
  quantity: string;
  message: string | null;
  status: OfferStatus;
  expiration_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOfferInput {
  listingId: string;
  buyerId: string;
  offeredPrice: number;
  quantity: number;
  message?: string;
}

export interface OfferResponse {
  id: string;
  listingId: string;
  buyerId: string;
  offeredPrice: number;
  quantity: number;
  message: string | null;
  status: OfferStatus;
  expirationReason: string | null;
  createdAt: string;
  updatedAt: string;
  cropName?: string;
  unit?: string;
  buyerName?: string;
  farmerId?: string;
  farmerName?: string;
}
