import React from 'react';
import { ProduceListing } from '../../data/types';
import { StatusPill } from '../common/StatusPill';

interface ProduceCardProps {
  listing: ProduceListing;
  onSelect: (listingId: string) => void;
}

export const ProduceCard: React.FC<ProduceCardProps> = ({ listing, onSelect }) => {
  const isSoldOut = listing.status === 'SOLD_OUT';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Grains': return '🌾';
      case 'Vegetables': return '🧅';
      case 'Pulses': return '🥣';
      case 'Oilseeds': return '🌻';
      case 'Fruits': return '🥭';
      default: return '🌱';
    }
  };

  return (
    <div className="agri-produce-card">
      <div className="agri-produce-img-box">
        <div className="agri-produce-img-fallback">
          <span className="agri-produce-img-fallback-icon" aria-hidden="true">
            {getCategoryIcon(listing.category)}
          </span>
          <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--color-soil-600)', fontWeight: 500 }}>
            {listing.category} Batch
          </span>
        </div>

        <span className="agri-produce-category-tag">
          {listing.category}
        </span>

        <span className="agri-produce-status-tag">
          <StatusPill status={listing.status} />
        </span>
      </div>

      <div className="agri-produce-body">
        <h3 className="agri-crop-name">{listing.productName}</h3>

        <div className="agri-price-box">
          <span className="agri-price-val">₹{listing.startingPrice.toLocaleString('en-IN')}</span>
          <span className="agri-price-unit">/ {listing.unit}</span>
        </div>

        <div className="agri-meta-list">
          <div className="agri-meta-item">
            <span>📦</span>
            <span>
              Available: <strong className="tabular-nums">{listing.quantity} {listing.unit}s</strong>
              {listing.quantity !== listing.totalQuantity && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', marginLeft: '0.35rem' }}>
                  (of {listing.totalQuantity})
                </span>
              )}
            </span>
          </div>

          <div className="agri-meta-item">
            <span>📍</span>
            <span>{listing.village}, {listing.district}</span>
          </div>

          <div className="agri-meta-item">
            <span>📅</span>
            <span>
              Ready by: {new Date(listing.availabilityDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button 
            type="button"
            className={isSoldOut ? 'btn-secondary' : 'btn-primary'}
            style={{ width: '100%', opacity: isSoldOut ? 0.7 : 1 }}
            onClick={() => onSelect(listing.id)}
          >
            {isSoldOut ? 'View Archive Details' : 'View & Make Offer'}
          </button>
        </div>
      </div>
    </div>
  );
};
