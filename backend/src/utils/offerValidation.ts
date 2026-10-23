import { OfferStatus } from '../types/offer';
import { DealStatus } from '../types/deal';

const VALID_OFFER_STATUSES: OfferStatus[] = [
  'ACTIVE',
  'WITHDRAWN',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
];

const VALID_DEAL_STATUSES: DealStatus[] = [
  'CONFIRMED',
  'PAYMENT_PENDING',
  'PAID',
  'DELIVERY',
  'COMPLETED',
  'CANCELLED',
];

export function isValidOfferStatus(value: unknown): value is OfferStatus {
  return (
    typeof value === 'string' &&
    VALID_OFFER_STATUSES.includes(value as OfferStatus)
  );
}

export function isValidDealStatus(value: unknown): value is DealStatus {
  return (
    typeof value === 'string' &&
    VALID_DEAL_STATUSES.includes(value as DealStatus)
  );
}

export function isValidPriceOrQuantity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  );
}
