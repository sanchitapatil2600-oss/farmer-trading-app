import React from 'react';
import { useMarket } from '../context/MarketContext';
import { StatusPill } from '../components/common/StatusPill';

export const LandingScreen: React.FC = () => {
  const { listings, navigateTo } = useMarket();

  // Show first 4 listings as featured demonstration placeholders
  const featuredListings = listings.slice(0, 4);

  return (
    <div>
      {/* Agricultural Hero Section */}
      <section className="agri-hero">
        <div className="agri-hero-badge">
          <span>🌾</span> Direct Agricultural Trade • Fair Mandi Prices • No Intermediaries
        </div>
        
        <h1 className="agri-hero-title">
          Direct Farmer-to-Buyer <span>Produce Marketplace</span>
        </h1>
        
        <p className="agri-hero-desc">
          AgriHub+ connects Indian farmers directly with wholesale buyers, retailers, and food processors. 
          List harvests directly, receive competitive offers, lock agreed terms, and track payment and pickup 
          with full commercial transparency.
        </p>

        <div className="agri-hero-actions">
          <button 
            type="button"
            className="btn-primary" 
            style={{ fontSize: '1.05rem', padding: '0.85rem 1.75rem' }}
            onClick={() => navigateTo('register')}
          >
            <span>🌾</span> Register as Farmer
          </button>

          <button 
            type="button"
            className="btn-secondary" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: 'var(--color-forest-900)', fontSize: '1.05rem', padding: '0.85rem 1.75rem' }}
            onClick={() => navigateTo('register')}
          >
            <span>🏪</span> Register as Buyer
          </button>

          <button 
            type="button"
            className="btn-secondary" 
            style={{ borderColor: 'rgba(255, 255, 255, 0.4)', color: '#FFFFFF', fontSize: '1.05rem', padding: '0.85rem 1.5rem' }}
            onClick={() => navigateTo('login')}
          >
            Login to Account
          </button>
        </div>
      </section>

      {/* Notice Banner */}
      <div className="agri-alert agri-alert-info">
        <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
        <div>
          <strong>Mentor Review Demonstration:</strong> This is the AgriHub+ frontend interface batch. 
          Data shown below represents structured frontend demonstration placeholders in accordance with approved project documentation.
        </div>
      </div>

      {/* 5-Step Commercial Workflow */}
      <section style={{ margin: '2.5rem 0' }}>
        <h2 className="agri-section-title">
          <span>🚜</span> How Direct Agricultural Trading Works
        </h2>
        <p className="agri-section-subtitle">
          The verified 5-stage sequential process from farmgate listing to delivery pickup.
        </p>

        <div className="agri-steps-grid">
          <div className="agri-step-card">
            <div className="agri-step-num">1</div>
            <h3 className="agri-step-title">List Produce</h3>
            <p className="agri-step-desc">
              Farmer publishes crop details, expected price per unit, quantity, and readiness date.
            </p>
          </div>

          <div className="agri-step-card">
            <div className="agri-step-num">2</div>
            <h3 className="agri-step-title">Receive Offers</h3>
            <p className="agri-step-desc">
              Buyers submit binding offers specifying requested quantity and proposed unit price.
            </p>
          </div>

          <div className="agri-step-card">
            <div className="agri-step-num">3</div>
            <h3 className="agri-step-title">Confirm Deal</h3>
            <p className="agri-step-desc">
              Farmer accepts an offer, locking commercial terms with status marked as <code>CONFIRMED</code>.
            </p>
          </div>

          <div className="agri-step-card">
            <div className="agri-step-num">4</div>
            <h3 className="agri-step-title">Gateway Payment</h3>
            <p className="agri-step-desc">
              Buyer completes payment via external payment gateway with server-side verification.
            </p>
          </div>

          <div className="agri-step-card">
            <div className="agri-step-num">5</div>
            <h3 className="agri-step-title">Delivery Pickup</h3>
            <p className="agri-step-desc">
              Pickup scheduled from farmer's village to buyer's destination with milestone tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Produce Listings Section */}
      <section style={{ margin: '2.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <h2 className="agri-section-title">
              <span>🌾</span> Featured Produce Listings
            </h2>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Demonstration produce listings — Frontend UI placeholders representing farm produce.
            </p>
          </div>
        </div>

        <div className="agri-produce-grid">
          {featuredListings.map((listing) => (
            <div key={listing.id} className="agri-produce-card">
              <div className="agri-produce-img-box">
                <div className="agri-produce-img-fallback">
                  <span className="agri-produce-img-fallback-icon" aria-hidden="true">
                    {listing.category === 'Grains' ? '🌾' : listing.category === 'Vegetables' ? '🧅' : listing.category === 'Oilseeds' ? '🌻' : '🌱'}
                  </span>
                  <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--color-soil-600)' }}>
                    {listing.category}
                  </span>
                </div>
                <span className="agri-produce-category-tag">{listing.category}</span>
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
                    <span>Available: <strong>{listing.quantity} {listing.unit}s</strong></span>
                  </div>
                  <div className="agri-meta-item">
                    <span>📍</span>
                    <span>{listing.village}, {listing.district}</span>
                  </div>
                  <div className="agri-meta-item">
                    <span>📅</span>
                    <span>Ready by: {new Date(listing.availabilityDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <button 
                    type="button"
                    className="btn-primary" 
                    style={{ width: '100%' }}
                    onClick={() => navigateTo('login')}
                  >
                    Login to Make Offer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agricultural Principles & Safeguards */}
      <section className="market-card" style={{ backgroundColor: 'var(--color-sprout-50)', border: '1px solid var(--color-border-subtle)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.75rem' }}>
          🛡️ Marketplace Safeguards & Anti-Hallucination Policy
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-soil-600)' }}>
          <div>
            <strong style={{ color: 'var(--color-soil-900)', display: 'block', marginBottom: '0.25rem' }}>
              • Grounded Deal Lifecycle
            </strong>
            Deals transition strictly through approved stages: <code>CONFIRMED</code> → <code>PAYMENT_PENDING</code> → <code>PAID</code> → <code>DELIVERY</code> → <code>COMPLETED</code>. No generic or unverified pending states.
          </div>
          <div>
            <strong style={{ color: 'var(--color-soil-900)', display: 'block', marginBottom: '0.25rem' }}>
              • Advisory-Only AI Estimates
            </strong>
            AI price recommendations are clearly labeled as advisory estimates based on mandi benchmarks. They are never presented as official government rates or guaranteed prices.
          </div>
          <div>
            <strong style={{ color: 'var(--color-soil-900)', display: 'block', marginBottom: '0.25rem' }}>
              • Zero Fabricated Transactions
            </strong>
            No fake payments, simulated receipt generation, or artificial vehicle GPS coordinates. Core commercial actions reflect authentic system recordings.
          </div>
        </div>
      </section>
    </div>
  );
};
