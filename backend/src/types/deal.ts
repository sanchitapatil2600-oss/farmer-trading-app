export type DealStatus =
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DealRow {
  id: string;
  listing_id: string;
  farmer_id: string;
  buyer_id: string;
  accepted_offer_id: string;
  quantity: string;
  agreed_price: string;
  total_amount: string;
  currency: string;
  status: DealStatus;
  created_at: Date;
  updated_at: Date;
}

export interface DealResponse {
  id: string;
  listingId: string;
  farmerId: string;
  buyerId: string;
  acceptedOfferId: string;
  quantity: number;
  agreedPrice: number;
  totalAmount: number;
  currency: string;
  status: DealStatus;
  createdAt: string;
  updatedAt: string;
  cropName?: string;
  unit?: string;
  farmerName?: string;
  buyerName?: string;
  originDistrict?: string;
  destinationDistrict?: string;
}
