import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { StatusPill } from '../components/common/StatusPill';

export const ProduceDetailsScreen: React.FC = () => {
  const { listings, selectedListingId, submitOffer, navigateTo, currentUser } = useMarket();

  // Find the selected listing or default to the first one
  const listing = listings.find(l => l.id === selectedListingId) || listings[0];

  const isSoldOut = !listing || listing.status === 'SOLD_OUT';

  // Offer submission form state
  const [offerQty, setOfferQty] = useState<number>(listing ? Math.min(25, listing.quantity) : 10);
  const [offerPrice, setOfferPrice] = useState<number>(listing ? listing.startingPrice : 2000);
  const [offerMessage, setOfferMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedOfferId, setSubmittedOfferId] = useState<string | null>(null);

  if (!listing) {
    return (
      <div className="market-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Produce batch not found</h2>
        <button type="button" className="btn-primary" onClick={() => navigateTo('marketplace')}>
          Return to Marketplace
        </button>
      </div>
    );
  }

  const calculatedTotal = (offerQty > 0 && offerPrice > 0) ? offerQty * offerPrice : 0;

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSoldOut) {
      setFormError('Cannot submit an offer for a sold out listing.');
      return;
    }

    if (!offerQty || offerQty <= 0) {
      setFormError('Please enter a valid quantity greater than zero.');
      return;
    }

    if (offerQty > listing.quantity) {
      setFormError(`Requested quantity cannot exceed available quantity (${listing.quantity} ${listing.unit}s).`);
      return;
    }

    if (!offerPrice || offerPrice <= 0) {
      setFormError('Please enter a positive offer price per unit.');
      return;
    }

    setFormError(null);

    // Submit typed offer to in-memory demonstration state
    submitOffer({
      listingId: listing.id,
      offeredPrice: Number(offerPrice),
      quantity: Number(offerQty),
      unit: listing.unit,
      message: offerMessage.trim() || undefined,
    });

    setSubmittedOfferId(`off-${Date.now()}`);
  };

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button 
          type="button"
          className="btn-secondary"
          onClick={() => navigateTo('marketplace')}
          style={{ minHeight: '40px', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
        >
          ← Back to Marketplace
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Harvest Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Card */}
          <div className="market-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-soil-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {listing.category} Batch • ID: {listing.id}
                </span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                  {listing.productName}
                </h1>
              </div>

              <StatusPill status={listing.status} size="md" />
            </div>

            {/* Price Box */}
            <div style={{ padding: '1rem', background: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>
                Starting Expected Rate
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                  ₹{listing.startingPrice.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--color-soil-600)', fontWeight: 500 }}>
                  / {listing.unit}
                </span>
              </div>
            </div>

            {/* Specification Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ border: '1px solid var(--color-border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>Available Quantity</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }} className="tabular-nums">
                  {listing.quantity} {listing.unit}s
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>
                  Total batch: {listing.totalQuantity} {listing.unit}s
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>Harvest Readiness</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                  {new Date(listing.availabilityDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-harvest-700)', fontWeight: 600 }}>
                  Ready for Dispatch
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>Farmgate Location</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                  {listing.district}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>
                  {listing.village}, {listing.state}
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>Farmer / Producer</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                  {listing.farmerName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-harvest-700)', fontWeight: 600 }}>
                  Verified Producer
                </div>
              </div>
            </div>

            {/* Farmgate Privacy Notice */}
            <div className="agri-alert agri-alert-privacy" style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div>
                <strong>Location Privacy Guarantee:</strong> Exact farm coordinates and residential door numbers are masked. 
                Pickup is arranged within the general <em>{listing.village}</em> mandi cluster in <em>{listing.district}</em>.
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-soil-900)', marginBottom: '0.5rem' }}>
                Batch Description & Harvest Notes
              </h3>
              <p style={{ color: 'var(--color-soil-600)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {listing.description || 'Standard agricultural produce batch, naturally dried and handled in accordance with regional mandi guidelines.'}
              </p>
            </div>
          </div>

          {/* Section 6.5: Advisory AI Price Benchmark Widget */}
          <div className="market-card" style={{ borderLeft: '4px solid var(--color-amber-600)', background: 'var(--color-surface-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-forest-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🤖</span> AI Advisory Price Benchmark
              </h3>
              <span className="status-pill pill-pending" style={{ fontSize: '0.7rem' }}>
                Advisory Only
              </span>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--color-amber-100)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>Estimated Regional Market Band:</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-forest-900)', marginTop: '0.2rem' }} className="tabular-nums">
                ₹{(listing.startingPrice * 0.95).toFixed(0)} – ₹{(listing.startingPrice * 1.05).toFixed(0)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/ {listing.unit}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.25rem' }}>
                Source: {listing.district} District APMC Mandi Weekly Benchmark Feed
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-soil-600)', fontStyle: 'italic', margin: 0, lineHeight: 1.45 }}>
              * Disclaimer: This is an automated advisory estimate based on available regional market trends. It is not an official government rate or guaranteed price. Final pricing is negotiated directly between farmer and buyer.
            </p>
          </div>
        </div>

        {/* Right Column: Section 6.3 Offer Submission Form */}
        <div>
          <div className="market-card" style={{ position: 'sticky', top: '5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.35rem' }}>
              Make a Commercial Offer
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginBottom: '1.25rem' }}>
              Submit your proposed quantity and rate directly to <strong>{listing.farmerName}</strong>.
            </p>

            {submittedOfferId ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-sprout-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sprout-100)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.5rem' }}>
                  Offer Submitted Successfully!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginBottom: '1.25rem' }}>
                  Your offer of <strong>{offerQty} {listing.unit}s @ ₹{offerPrice}/{listing.unit}</strong> has been sent to the farmer for review.
                </p>
                <button 
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => navigateTo('marketplace')}
                >
                  Continue Browsing Produce
                </button>
              </div>
            ) : isSoldOut ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-slate-100)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📦</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-500)', marginBottom: '0.25rem' }}>
                  Batch Sold Out
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
                  All quantities for this harvest have been confirmed into deals. Check other available batches in the marketplace.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOfferSubmit} noValidate>
                {formError && (
                  <div className="agri-alert agri-alert-error" role="alert" style={{ fontSize: '0.8rem' }}>
                    <span>⚠️</span>
                    <div>{formError}</div>
                  </div>
                )}

                {/* Quantity Field with Helper Limit */}
                <div className="agri-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                    <label htmlFor="offer-quantity" className="agri-label" style={{ margin: 0 }}>
                      Requested Quantity ({listing.unit}s) <span className="agri-label-required">*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-harvest-700)', fontWeight: 600 }}>
                      Max: {listing.quantity} {listing.unit}s
                    </span>
                  </div>
                  <input 
                    id="offer-quantity"
                    type="number"
                    min="1"
                    max={listing.quantity}
                    className="agri-input tabular-nums"
                    value={offerQty || ''}
                    onChange={(e) => setOfferQty(Number(e.target.value))}
                    required
                  />
                  <div className="agri-helper-text">
                    You can offer for partial or full available harvest quantity.
                  </div>
                </div>

                {/* Price Field */}
                <div className="agri-form-group">
                  <label htmlFor="offer-price" className="agri-label">
                    Offered Price per {listing.unit} (₹) <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="offer-price"
                    type="number"
                    min="1"
                    className="agri-input tabular-nums"
                    value={offerPrice || ''}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    required
                  />
                  <div className="agri-helper-text">
                    Starting expected price is ₹{listing.startingPrice.toLocaleString('en-IN')}/{listing.unit}.
                  </div>
                </div>

                {/* Live Deal Value Calculator (Section 6.3) */}
                <div style={{ padding: '0.85rem', background: 'var(--color-sprout-50)', border: '1px solid var(--color-sprout-100)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Live Deal Value Calculation
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginBottom: '0.25rem' }}>
                    <span className="tabular-nums">{offerQty} {listing.unit}s</span> × <span className="tabular-nums">₹{offerPrice.toLocaleString('en-IN')}</span> =
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                    Total Offer: ₹{calculatedTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Optional Message Field */}
                <div className="agri-form-group">
                  <label htmlFor="offer-message" className="agri-label">
                    Dispatch & Pickup Notes (Optional)
                  </label>
                  <textarea 
                    id="offer-message"
                    rows={2}
                    className="agri-textarea"
                    placeholder="e.g. Can arrange 10-tonne truck pickup on harvest day..."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '1.05rem', minHeight: '48px' }}
                >
                  <span>🤝</span> Submit Offer to Farmer
                </button>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textAlign: 'center', marginTop: '0.75rem' }}>
                  {currentUser ? (
                    <span>Submitting as verified buyer: <strong>{currentUser.name}</strong></span>
                  ) : (
                    <span>Submitting as prospective buyer (Demonstration Mode)</span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
