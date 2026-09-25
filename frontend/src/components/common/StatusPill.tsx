import React from 'react';

interface StatusPillProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, size = 'sm' }) => {
  const displayLabel = label || status.replace(/_/g, ' ');

  // Standard token mappings per docs/UI_UX_DESIGN_SYSTEM.md
  let badgeClass = 'pill-pending';

  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'PICKUP_SCHEDULED':
    case 'PICKED_UP':
    case 'DELIVERY':
      badgeClass = 'pill-active';
      break;

    case 'PAID':
    case 'DELIVERED':
    case 'ACCEPTED':
    case 'COMPLETED':
      badgeClass = 'pill-active'; // Sprout/harvest highlight
      break;

    case 'PAYMENT_PENDING':
    case 'PENDING':
      badgeClass = 'pill-pending';
      break;

    case 'SOLD_OUT':
    case 'WITHDRAWN':
    case 'EXPIRED':
      badgeClass = 'pill-soldout';
      break;

    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
      badgeClass = 'pill-danger';
      break;

    default:
      badgeClass = 'pill-pending';
      break;
  }

  const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';
  const padding = size === 'sm' ? '0.2rem 0.6rem' : '0.35rem 0.8rem';

  return (
    <span 
      className={`status-pill ${badgeClass}`} 
      style={{ fontSize, padding }}
      role="status"
    >
      {displayLabel}
    </span>
  );
};
