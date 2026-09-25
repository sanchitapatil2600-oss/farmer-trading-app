// ==========================================================================
// FARMER TRADING MARKETPLACE (AgriHub+) — CORE FRONTEND TYPE DEFINITIONS
// Aligned with docs/PRD.md, docs/DATABASE.md, and docs/API.md
// ==========================================================================

export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  // Farmer-specific fields
  village?: string;
  district: string;
  state: string;
  // Buyer-specific fields
  buyerType?: 'Consumer' | 'Retailer' | 'Wholesaler' | 'Food Processor' | 'Agricultural Business';
  organizationName?: string;
  city?: string;
}

// Strictly approved listing statuses per PRD & architecture
export type ListingStatus = 'ACTIVE' | 'SOLD_OUT';

export interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  productName: string;
  category: 'Grains' | 'Vegetables' | 'Pulses' | 'Oilseeds' | 'Fruits';
  description?: string;
  quantity: number; // Available quantity
  totalQuantity: number; // Originally listed quantity
  unit: 'quintal' | 'kg' | 'tonne';
  startingPrice: number; // Price per unit
  currency: 'INR';
  availabilityDate: string;
  village: string; // General location only (no exact private address)
  district: string;
  state: string;
  imageUrl?: string;
  status: ListingStatus;
  createdAt: string;
}

// Approved offer statuses per PRD & architecture
export type OfferStatus = 'ACTIVE' | 'WITHDRAWN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Offer {
  id: string;
  listingId: string;
  listingProductName: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  buyerType?: string;
  offeredPrice: number; // Price per unit
  quantity: number;
  unit: 'quintal' | 'kg' | 'tonne';
  status: OfferStatus;
  message?: string;
  createdAt: string;
}

// Exactly approved 5-stage sequential deal lifecycle (+ CANCELLED)
// CONFIRMED ──► PAYMENT_PENDING ──► PAID ──► DELIVERY ──► COMPLETED
export type DealStatus = 
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Deal {
  id: string;
  listingId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  acceptedOfferId: string;
  quantity: number;
  unit: 'quintal' | 'kg' | 'tonne';
  agreedPrice: number; // Price per unit
  totalAmount: number; // quantity * agreedPrice
  currency: 'INR';
  status: DealStatus;
  createdAt: string;
  updatedAt: string;
  originDistrict: string;
  destinationDistrict: string;
}

// Neutral payment status matching external gateway integration specs
export type PaymentState = 'PENDING' | 'PAID' | 'FAILED';

export interface PaymentRecord {
  id: string;
  dealId: string;
  amount: number;
  currency: 'INR';
  status: PaymentState;
  gatewayProvider: string;
  gatewayOrderId: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

// Exactly approved delivery status lifecycle per PRD & architecture
// PENDING ──► PICKUP_SCHEDULED ──► PICKED_UP ──► IN_TRANSIT ──► DELIVERED
export type DeliveryStatus = 
  | 'PENDING'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryRecord {
  id: string;
  dealId: string;
  status: DeliveryStatus;
  pickupDate?: string;
  originVillage: string;
  originDistrict: string;
  destinationCity: string;
  destinationDistrict: string;
  vehicleType?: string;
  transporterNotes?: string;
  deliveredAt?: string;
  updatedAt: string;
}

// AI advisory price recommendation interface
export interface AIPriceAdvisory {
  crop: string;
  quantity: number;
  unit: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  currency: 'INR';
  dataSource: string;
  modelInfo: string;
  isAvailable: boolean;
  status: 'SUCCESS' | 'INSUFFICIENT_DATA';
  disclaimer: string;
}

// UI navigation screens
export type ScreenName = 
  | 'landing'
  | 'login'
  | 'register'
  | 'farmer_dashboard'
  | 'marketplace'
  | 'produce_details'
  | 'add_produce'
  | 'my_listings'
  | 'offers'
  | 'deal_tracker'
  | 'ai_price'
  | 'payment_status'
  | 'delivery_status';
