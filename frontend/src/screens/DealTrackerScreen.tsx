import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { DealLifecycleTracker } from '../components/common/DealLifecycleTracker';
import { StatusPill } from '../components/common/StatusPill';
import { DealStatus } from '../data/types';

export const DealTrackerScreen: React.FC = () => {
  const { deals, selectedDealId, payments, deliveries, updateDealStatus, navigateTo } = useMarket();

  // Selected deal or default to first deal
  const currentDealId = selectedDealId || (deals.length > 0 ? deals[0].id : null);
  const deal = deals.find(d => d.id === currentDealId) || deals[0];

  const [notification, setNotification] = useState<string | null>(null);

  if (!deal) {
    return (
      <div className="market-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>No confirmed deals recorded yet</h2>
        <p style={{ color: 'var(--color-soil-600)', margin: '1rem 0' }}>
          Deals are created when a farmer accepts an offer.
        </p>
        <button type="button" className="btn-primary" onClick={() => navigateTo('farmer_dashboard')}>
          Go to Farmer Dashboard
        </button>
      </div>
    );
  }

  // Linked records
  const payment = payments.find(p => p.dealId === deal.id);
  const delivery = deliveries.find(del => del.dealId === deal.id);

  const handleAdvanceStatus = (nextStatus: DealStatus) => {
    updateDealStatus(deal.id, nextStatus);
    setNotification(`Deal status advanced to ${nextStatus} (Demonstration State Updated).`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div>
      {/* Header and Deal Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🤝</span>
              <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: 0 }}>
                Deal Details &amp; Lifecycle Tracker
              </h1>
            </div>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              The authoritative commercial transaction between Farmer and Buyer, strictly following approved lifecycle stages.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {deals.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="deal-select" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-soil-600)' }}>
                  Select Deal:
                </label>
                <select 
                  id="deal-select"
                  className="agri-select"
                  style={{ minHeight: '40px', padding: '0.25rem 0.5rem', width: 'auto' }}
                  value={deal.id}
                  onChange={(e) => navigateTo('deal_tracker', { dealId: e.target.value })}
                >
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} — {d.productName} ({d.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigateTo('farmer_dashboard')}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="agri-alert agri-alert-info" role="alert">
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div>{notification}</div>
        </div>
      )}

      {/* 5-Stage Sequential Lifecycle Tracker Card */}
      <div className="market-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-forest-900)' }}>
              Approved Deal Progression Pipeline
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
              Sequential stages from offer acceptance to verified completion.
            </p>
          </div>
          <StatusPill status={deal.status} size="md" />
        </div>

        {/* Section 6.4 DealLifecycleTracker */}
        <DealLifecycleTracker status={deal.status} />

        {/* Mentor Demonstration Stage Progression Toolbar */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-soil-600)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            ⚙️ Demonstration Lifecycle Progression (Mentor Review)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {deal.status === 'CONFIRMED' && (
              <>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAdvanceStatus('PAYMENT_PENDING')}
                >
                  Advance to PAYMENT_PENDING ►
                </button>
                <button 
                  type="button"
                  className="btn-secondary"
                  style={{ color: 'var(--color-terracotta-700)', borderColor: 'var(--color-terracotta-700)' }}
                  onClick={() => handleAdvanceStatus('CANCELLED')}
                >
                  Cancel Deal
                </button>
              </>
            )}

            {deal.status === 'PAYMENT_PENDING' && (
              <>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAdvanceStatus('PAID')}
                >
                  Advance to PAID (Simulate Verified Payment) ►
                </button>
                <button 
                  type="button"
                  className="btn-secondary"
                  style={{ color: 'var(--color-terracotta-700)', borderColor: 'var(--color-terracotta-700)' }}
                  onClick={() => handleAdvanceStatus('CANCELLED')}
                >
                  Cancel Deal
                </button>
              </>
            )}

            {deal.status === 'PAID' && (
              <button 
                type="button"
                className="btn-primary"
                onClick={() => handleAdvanceStatus('DELIVERY')}
              >
                Advance to DELIVERY (Pickup Initiated) ►
              </button>
            )}

            {deal.status === 'DELIVERY' && (
              <button 
                type="button"
                className="btn-primary"
                onClick={() => handleAdvanceStatus('COMPLETED')}
              >
                Advance to COMPLETED (Produce Delivered) ✓
              </button>
            )}

            {(deal.status === 'COMPLETED' || deal.status === 'CANCELLED') && (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                This deal has reached its terminal lifecycle status ({deal.status}).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deal Commercial Contract Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Commercial Terms Summary */}
        <div className="market-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
            Commercial Contract Terms
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border-subtle)', paddingBottom: '0.35rem' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Produce Batch:</span>
              <strong>{deal.productName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border-subtle)', paddingBottom: '0.35rem' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Confirmed Quantity:</span>
              <strong className="tabular-nums">{deal.quantity} {deal.unit}s</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border-subtle)', paddingBottom: '0.35rem' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Agreed Rate per Unit:</span>
              <strong className="tabular-nums">₹{deal.agreedPrice.toLocaleString('en-IN')} / {deal.unit}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-sprout-50)', borderRadius: 'var(--radius-sm)', color: 'var(--color-forest-900)', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>Total Agreed Deal Amount:</span>
              <strong className="tabular-nums" style={{ fontSize: '1.25rem' }}>₹{deal.totalAmount.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-soil-600)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              <span>Accepted Offer Ref:</span>
              <code style={{ fontFamily: 'monospace' }}>{deal.acceptedOfferId}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-soil-600)', fontSize: '0.8rem' }}>
              <span>Deal Confirmed At:</span>
              <span>{new Date(deal.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Counterparty & Routing Details */}
        <div className="market-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
            Parties &amp; Logistics Route
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div style={{ background: 'var(--color-canvas-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>
                🌾 Seller (Farmer)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                {deal.farmerName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
                Origin: {deal.originDistrict} District (Farmgate Cluster)
              </div>
            </div>

            <div style={{ background: 'var(--color-canvas-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>
                🏪 Buyer (Vyapari / Retailer)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                {deal.buyerName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
                Destination: {deal.destinationDistrict} District
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              <span>Payment Gateway Record:</span>
              <StatusPill status={payment ? payment.status : 'PENDING'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              <span>Delivery Logistics Milestone:</span>
              <StatusPill status={delivery ? delivery.status : 'PENDING'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
