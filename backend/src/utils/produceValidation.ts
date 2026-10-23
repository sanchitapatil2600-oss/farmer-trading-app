import {
  ProduceUnit,
  ProduceListingStatus,
} from '../types/produce';

const VALID_UNITS: ProduceUnit[] = [
  'KG',
  'QUINTAL',
  'TON',
  'DOZEN',
  'BAG',
  'OTHER',
];

const VALID_STATUSES: ProduceListingStatus[] = [
  'ACTIVE',
  'SOLD_OUT',
];

export function isValidProduceUnit(
  value: unknown
): value is ProduceUnit {
  return (
    typeof value === 'string' &&
    VALID_UNITS.includes(value.trim().toUpperCase() as ProduceUnit)
  );
}

export function isValidProduceStatus(
  value: unknown
): value is ProduceListingStatus {
  return (
    typeof value === 'string' &&
    VALID_STATUSES.includes(value as ProduceListingStatus)
  );
}

export function isValidDateString(
  value: unknown
): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isPositiveNumber(
  value: unknown
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  );
}

export function isNonNegativeInteger(
  value: unknown
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  );
}

export function isValidUuid(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function cleanOptionalString(
  value: unknown
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function cleanRequiredString(
  value: unknown
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}