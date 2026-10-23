import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusPill } from '../components/common/StatusPill';

export const FarmerDashboardScreen: React.FC = () => {
  const {
    currentUser,
    listings,
    offers,
    deals,
    deliveries,
    acceptOffer,
    rejectOffer,
    navigateTo
  } = useMarket();

  const [notification, setNotification] = useState<string | null>(null);
  const [submittingOfferId, setSubmittingOfferId] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="market-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--color-canvas-bg)' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🌾</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.5rem' }}>
          Farmer Dashboard Access
        </h2>
        <p style={{ color: 'var(--color-soil-600)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          Please log in to your registered farmer account to view your produce batches, inspect incoming buyer offers, and manage commercial deals.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigateTo('login')}
        >
          Login as Farmer
        </button>
      </div>
    );
  }

  if (currentUser.role !== 'FARMER') {
    return (
      <div className="market-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--color-canvas-bg)' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🏪</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.5rem' }}>
          Logged in as Buyer ({currentUser.name})
        </h2>
        <p style={{ color: 'var(--color-soil-600)', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          The Farmer Dashboard is dedicated to agricultural producers managing crop inventories and incoming bids. As a buyer, you can browse listings and track your submitted offers in the Buyer Marketplace.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigateTo('marketplace')}
          >
            Go to Buyer Marketplace
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigateTo('offers')}
          >
            View My Offers
          </button>
        </div>
      </div>
    );
  }

  // Filter items relevant to the farmer
  const farmerId = currentUser.id;
  const farmerListings = listings.filter(l => l.farmerId === farmerId);
  const activeListingsCount = farmerListings.filter(l => l.status === 'ACTIVE').length;

  const farmerOffers = offers.filter(o => o.farmerId === farmerId);
  const pendingOffers = farmerOffers.filter(o => o.status === 'ACTIVE');

  const farmerDeals = deals.filter(d => d.farmerId === farmerId);
  const activeDeliveriesCount = deliveries.filter(del =>
    del.status === 'PICKUP_SCHEDULED' || del.status === 'IN_TRANSIT'
  ).length;

  const handleAccept = async (offerId: string, cropName: string, buyerName: string) => {
    setSubmittingOfferId(offerId);
    const res = await acceptOffer(offerId);
    setSubmittingOfferId(null);
    if (res.success) {
      setNotification(`Offer accepted for ${cropName} from ${buyerName}. A new deal has been created with status CONFIRMED.`);
    } else {
      setNotification(`Failed to accept offer: ${res.error || 'Server error'}`);
    }
    setTimeout(() => setNotification(null), 6000);
  };

  const handleReject = async (offerId: string) => {
    setSubmittingOfferId(offerId);
    const res = await rejectOffer(offerId);
    setSubmittingOfferId(null);
    if (res.success) {
      setNotification('Offer has been rejected.');
    } else {
      setNotification(`Failed to reject offer: ${res.error || 'Server error'}`);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div>
      {/* Farmer Welcome Header */}
      <div className="market-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--color-sprout-50) 0%, #FFFFFF 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🌾</span>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-forest-900)' }}>
                {currentUser?.name || 'Ramesh Patil'}
              </h1>
              <span className="status-pill pill-active">Farmer (Kisan)</span>
            </div>
            <p style={{ color: 'var(--color-soil-600)', fontSize: '0.9rem' }}>
              📍 Farmgate Locality: <strong>{currentUser?.village || 'Pimpalgaon Baswant'}</strong>, {currentUser?.district || 'Nashik'}, {currentUser?.state || 'Maharashtra'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigateTo('add_produce')}
            >
              <span>🌱</span> Add Produce Listing
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigateTo('marketplace')}
            >
              <span>🏪</span> Explore Buyer Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Operational Notification */}
      {notification && (
        <div className="agri-alert agri-alert-info" role="alert">
          <span style={{ fontSize: '1.25rem' }}>✅</span>
          <div>
            <strong>Demonstration State Updated:</strong> {notification}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard
          title="Active Produce Batches"
          value={activeListingsCount}
          subtitle="Listed crops open for bids"
          icon="📦"
        />

        <MetricCard
          title="Pending Received Offers"
          value={pendingOffers.length}
          subtitle="Awaiting your acceptance"
          icon="📬"
          trend={pendingOffers.length > 0 ? `${pendingOffers.length} Action Needed` : undefined}
        />

        <MetricCard
          title="Confirmed Deals"
          value={farmerDeals.length}
          subtitle="Total agreed commercial deals"
          icon="🤝"
        />

        <MetricCard
          title="Logistics Pickups"
          value={activeDeliveriesCount}
          subtitle="In transit or scheduled"
          icon="🚛"
        />
      </div>

      {/* Received Offers Section */}
      <section className="market-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 className="agri-section-title" style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>
              <span>📬</span> Received Offers Awaiting Decision
            </h2>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Review offers submitted by verified buyers. Accepting creates a deal and updates available inventory.
            </p>
          </div>
          <span className="status-pill pill-active">
            {pendingOffers.length} Pending Decision
          </span>
        </div>

        {pendingOffers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-soil-600)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🌱</span>
            No pending offers awaiting review at this moment. New incoming offers will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingOffers.map((offer) => {
              const totalOfferVal = offer.quantity * offer.offeredPrice;
              return (
                <div
                  key={offer.id}
                  style={{
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    backgroundColor: 'var(--color-surface-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-soil-900)' }}>
                        {offer.listingProductName}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
                        Buyer: <strong>{offer.buyerName}</strong> {offer.buyerType && `(${offer.buyerType})`}
                      </div>
                    </div>

                    <StatusPill status={offer.status} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: 'var(--color-canvas-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Offered Rate</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                        ₹{offer.offeredPrice.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ {offer.unit}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Requested Quantity</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                        {offer.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{offer.unit}s</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Total Deal Amount</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-harvest-700)' }} className="tabular-nums">
                        ₹{totalOfferVal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {offer.message && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', fontStyle: 'italic' }}>
                      💬 Buyer note: "{offer.message}"
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ color: 'var(--color-terracotta-700)', borderColor: 'var(--color-terracotta-700)' }}
                      onClick={() => handleReject(offer.id)}
                      disabled={submittingOfferId === offer.id}
                    >
                      {submittingOfferId === offer.id ? 'Processing...' : 'Reject Offer'}
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleAccept(offer.id, offer.listingProductName, offer.buyerName)}
                      disabled={submittingOfferId === offer.id}
                    >
                      {submittingOfferId === offer.id ? 'Confirming Deal...' : (
                        <><span>🤝</span> Accept Offer & Confirm Deal</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmed Deals Section */}
      <section className="market-card">
        <h2 className="agri-section-title" style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>
          <span>🤝</span> Active Deals & Agreements
        </h2>
        <p className="agri-section-subtitle">
          Commercial transactions created upon accepted offers, strictly following approved deal statuses.
        </p>

        {farmerDeals.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-soil-600)' }}>
            No confirmed deals yet. Once you accept an offer, the deal record will be tracked here.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {farmerDeals.map((deal) => (
              <div
                key={deal.id}
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-surface-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', fontFamily: 'monospace' }}>
                    ID: {deal.id}
                  </span>
                  <StatusPill status={deal.status} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-soil-900)', marginBottom: '0.25rem' }}>
                  {deal.productName}
                </h3>

                <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginBottom: '0.75rem' }}>
                  Buyer: <strong>{deal.buyerName}</strong>
                </div>

                <div style={{ background: 'var(--color-canvas-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Quantity:</span>
                    <strong className="tabular-nums">{deal.quantity} {deal.unit}s</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Agreed Rate:</span>
                    <strong className="tabular-nums">₹{deal.agreedPrice.toLocaleString('en-IN')} / {deal.unit}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-forest-900)' }}>
                    <span>Total Agreed Value:</span>
                    <strong className="tabular-nums" style={{ fontSize: '1rem' }}>₹{deal.totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>
                  Deal Status: <strong>{deal.status}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
