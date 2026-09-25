import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { StatusPill } from '../components/common/StatusPill';

export const MyListingsScreen: React.FC = () => {
  const { listings, offers, currentUser, navigateTo } = useMarket();
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'SOLD_OUT'>('ALL');

  const farmerId = currentUser?.id || 'usr-f-001';
  const myListings = listings.filter(l => l.farmerId === farmerId);

  const filteredListings = myListings.filter(l => {
    if (filterTab === 'ACTIVE') return l.status === 'ACTIVE';
    if (filterTab === 'SOLD_OUT') return l.status === 'SOLD_OUT';
    return true;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
              <span>🌾</span> My Produce Listings
            </h1>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Manage your agricultural harvests, track remaining stock quantities, and inspect buyer offers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              onClick={() => navigateTo('farmer_dashboard')}
            >
              ← Farmer Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          type="button"
          className={`agri-nav-btn ${filterTab === 'ALL' ? 'active' : ''}`}
          style={{ color: filterTab === 'ALL' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: filterTab === 'ALL' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setFilterTab('ALL')}
        >
          All Listings ({myListings.length})
        </button>

        <button 
          type="button"
          className={`agri-nav-btn ${filterTab === 'ACTIVE' ? 'active' : ''}`}
          style={{ color: filterTab === 'ACTIVE' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: filterTab === 'ACTIVE' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setFilterTab('ACTIVE')}
        >
          Active Batches ({myListings.filter(l => l.status === 'ACTIVE').length})
        </button>

        <button 
          type="button"
          className={`agri-nav-btn ${filterTab === 'SOLD_OUT' ? 'active' : ''}`}
          style={{ color: filterTab === 'SOLD_OUT' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: filterTab === 'SOLD_OUT' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setFilterTab('SOLD_OUT')}
        >
          Sold Out Archive ({myListings.filter(l => l.status === 'SOLD_OUT').length})
        </button>
      </div>

      {/* Listings List */}
      {filteredListings.length === 0 ? (
        <div className="market-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--color-canvas-bg)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📦</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-soil-900)', marginBottom: '0.25rem' }}>
            No listings found in this category
          </h3>
          <p style={{ color: 'var(--color-soil-600)', fontSize: '0.9rem' }}>
            You can view all listings by selecting the "All Listings" tab above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredListings.map((listing) => {
            const listingOffers = offers.filter(o => o.listingId === listing.id);
            const activeOffers = listingOffers.filter(o => o.status === 'ACTIVE');
            const percentAvailable = listing.totalQuantity > 0 
              ? Math.round((listing.quantity / listing.totalQuantity) * 100) 
              : 0;

            return (
              <div 
                key={listing.id}
                className="market-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {listing.category} • Batch ID: {listing.id}
                    </span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                      {listing.productName}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginTop: '0.25rem' }}>
                      📍 {listing.village}, {listing.district}, {listing.state}
                    </div>
                  </div>

                  <StatusPill status={listing.status} size="md" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--color-canvas-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Available Quantity</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                      {listing.quantity} {listing.unit}s
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>
                      Original listed: {listing.totalQuantity} {listing.unit}s
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Expected Starting Rate</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                      ₹{listing.startingPrice.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ {listing.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>
                      Total Batch Value: ₹{(listing.quantity * listing.startingPrice).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Harvest Readiness</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.15rem' }}>
                      {new Date(listing.availabilityDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-harvest-700)', fontWeight: 600 }}>
                      Dispatched from farmgate
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Offers Received</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: activeOffers.length > 0 ? 'var(--color-amber-600)' : 'var(--color-soil-900)' }} className="tabular-nums">
                      {listingOffers.length} offers
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>
                      {activeOffers.length} awaiting decision
                    </div>
                  </div>
                </div>

                {/* Stock progress bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-soil-600)', marginBottom: '0.25rem' }}>
                    <span>Stock Availability Bar</span>
                    <span className="tabular-nums">{percentAvailable}% available ({listing.quantity} / {listing.totalQuantity} {listing.unit}s)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentAvailable}%`, 
                        backgroundColor: percentAvailable > 0 ? 'var(--color-harvest-600)' : 'var(--color-slate-500)',
                        transition: 'width 0.3s ease',
                      }} 
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigateTo('produce_details', { listingId: listing.id })}
                  >
                    View Batch Details
                  </button>

                  <button 
                    type="button"
                    className="btn-primary"
                    onClick={() => navigateTo('offers')}
                  >
                    <span>📬</span> Review Offers ({listingOffers.length})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
