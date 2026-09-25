import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { StatusPill } from '../components/common/StatusPill';

export const PaymentStatusScreen: React.FC = () => {
  const { deals, payments, selectedDealId, updatePaymentStatus, updateDealStatus, navigateTo } = useMarket();

  // Selected deal or default to first
  const currentDealId = selectedDealId || (deals.length > 0 ? deals[0].id : null);
  const deal = deals.find(d => d.id === currentDealId) || deals[0];
  const payment = payments.find(p => p.dealId === deal?.id);

  const [notification, setNotification] = useState<string | null>(null);

  if (!deal) {
    return (
      <div className="market-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>No deals available for payment review</h2>
        <button type="button" className="btn-primary" onClick={() => navigateTo('farmer_dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleTogglePaymentStatus = (newStatus: 'PENDING' | 'PAID') => {
    updatePaymentStatus(deal.id, newStatus);
    if (newStatus === 'PAID') {
      updateDealStatus(deal.id, 'PAID');
      setNotification('Demonstration state updated: Payment marked as PAID and Deal advanced to PAID.');
    } else {
      updateDealStatus(deal.id, 'PAYMENT_PENDING');
      setNotification('Demonstration state updated: Payment marked as PENDING.');
    }
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: 0 }}>
                Payment Gateway &amp; Transaction Status Details
              </h1>
            </div>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              External payment gateway reference information linked to confirmed commercial deals.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {deals.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="payment-deal-select" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-soil-600)' }}>
                  Deal:
                </label>
                <select 
                  id="payment-deal-select"
                  className="agri-select"
                  style={{ minHeight: '40px', padding: '0.25rem 0.5rem', width: 'auto' }}
                  value={deal.id}
                  onChange={(e) => navigateTo('payment_status', { dealId: e.target.value })}
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
              onClick={() => navigateTo('deal_tracker', { dealId: deal.id })}
            >
              View Deal Tracker
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Frontend Demonstration Notice */}
      <div className="agri-alert agri-alert-warning">
        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
        <div>
          <strong>Frontend Demonstration Mode:</strong> This screen illustrates payment gateway and transaction status details for review. 
          <strong>No real payment was conducted or completed.</strong> In production, payment verification is strictly executed server-side via external payment gateway webhooks.
        </div>
      </div>

      {notification && (
        <div className="agri-alert agri-alert-info" role="alert">
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div>{notification}</div>
        </div>
      )}

      {/* Main Payment Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Payment Summary Card */}
        <div className="market-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>
                Transaction Summary
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                {deal.productName}
              </h2>
            </div>
            <StatusPill status={payment ? payment.status : 'PENDING'} size="md" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Linked Deal ID:</span>
              <strong style={{ fontFamily: 'monospace' }}>{deal.id}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Beneficiary Farmer:</span>
              <strong>{deal.farmerName} ({deal.originDistrict})</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Purchaser (Buyer):</span>
              <strong>{deal.buyerName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Confirmed Quantity:</span>
              <strong className="tabular-nums">{deal.quantity} {deal.unit}s @ ₹{deal.agreedPrice}/{deal.unit}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--color-sprout-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-sprout-100)', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-forest-900)' }}>Payable Commercial Amount:</span>
              <span className="tabular-nums" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-forest-900)' }}>
                ₹{deal.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {payment && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-soil-600)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <span>Gateway Order Ref:</span>
                  <code style={{ fontFamily: 'monospace' }}>{payment.gatewayOrderId}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-soil-600)', fontSize: '0.8rem' }}>
                  <span>Supported Methods:</span>
                  <span>{payment.paymentMethod || 'UPI / NetBanking / NEFT'}</span>
                </div>
                {payment.paidAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-harvest-700)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span>Verified Timestamp:</span>
                    <span>{new Date(payment.paidAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mentor Demonstration Toggle Controls */}
          <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-soil-600)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              ⚙️ Demonstration Status Toggle (Review Mode)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn-primary"
                onClick={() => handleTogglePaymentStatus('PAID')}
              >
                Set Demonstration State to PAID
              </button>
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => handleTogglePaymentStatus('PENDING')}
              >
                Set Demonstration State to PENDING
              </button>
            </div>
          </div>
        </div>

        {/* Security & Architecture Guidelines Card */}
        <div className="market-card" style={{ background: 'var(--color-canvas-bg)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.75rem' }}>
            🛡️ Payment Architecture Standards
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', lineHeight: 1.5, marginBottom: '1rem' }}>
            In strict compliance with <code>docs/SECURITY.md</code> and <code>docs/ARCHITECTURE.md</code>:
          </p>

          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-soil-600)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <strong>Zero Card or Banking Credential Storage:</strong> The application database never collects, stores, or handles credit/debit card numbers, UPI PINs, or banking credentials.
            </li>
            <li>
              <strong>Certified External Gateway:</strong> Online payments are redirected directly to a certified external payment gateway.
            </li>
            <li>
              <strong>Server-Side Verification:</strong> Deal status updates to <code>PAID</code> exclusively after verified server-to-server gateway callbacks. Client-side callbacks are never trusted as proof of payment.
            </li>
            <li>
              <strong>Neutral Status Presentation:</strong> Displays transaction and gateway status without unsubstantiated financial claims.
            </li>
          </ul>

          <div style={{ marginTop: '1.5rem' }}>
            <button 
              type="button"
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => navigateTo('delivery_status', { dealId: deal.id })}
            >
              View Linked Delivery Status ►
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
