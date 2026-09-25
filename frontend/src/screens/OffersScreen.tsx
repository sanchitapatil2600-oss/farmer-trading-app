import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { StatusPill } from '../components/common/StatusPill';

export const OffersScreen: React.FC = () => {
  const { 
    currentUser, 
    offers, 
    deals,
    acceptOffer, 
    rejectOffer, 
    withdrawOffer, 
    navigateTo 
  } = useMarket();

  // Tab: Received Offers (Farmer) vs My Submitted Offers (Buyer)
  const defaultTab = currentUser?.role === 'BUYER' ? 'BUYER_OFFERS' : 'FARMER_OFFERS';
  const [activeTab, setActiveTab] = useState<'FARMER_OFFERS' | 'BUYER_OFFERS'>(defaultTab);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const farmerId = currentUser?.id || 'usr-f-001';
  const buyerId = currentUser?.id || 'usr-b-001';

  const receivedOffers = offers.filter(o => o.farmerId === farmerId);
  const submittedOffers = offers.filter(o => o.buyerId === buyerId);

  const displayedOffers = (activeTab === 'FARMER_OFFERS' ? receivedOffers : submittedOffers).filter(o => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  const handleAccept = (offerId: string, cropName: string, buyerName: string) => {
    acceptOffer(offerId);
    setNotification(`Offer accepted for ${cropName} from ${buyerName}. A new deal has been created with status CONFIRMED.`);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleReject = (offerId: string) => {
    rejectOffer(offerId);
    setNotification('Offer has been marked as REJECTED.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleWithdraw = (offerId: string) => {
    withdrawOffer(offerId);
    setNotification('Your offer has been WITHDRAWN.');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
              <span>📬</span> Produce Offers &amp; Negotiations
            </h1>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Track direct commercial offers, review terms, and finalize agreed transactions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => navigateTo('farmer_dashboard')}
            >
              Farmer Dashboard
            </button>
            <button 
              type="button"
              className="btn-primary"
              onClick={() => navigateTo('marketplace')}
            >
              Buyer Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="agri-alert agri-alert-info" role="alert">
          <span style={{ fontSize: '1.25rem' }}>✅</span>
          <div>
            <strong>Demonstration State Updated:</strong> {notification}
          </div>
        </div>
      )}

      {/* Dual Perspective Role Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div 
          className={`agri-role-option-card ${activeTab === 'FARMER_OFFERS' ? 'selected' : ''}`}
          style={{ flex: 1, minWidth: '220px', padding: '0.85rem' }}
          onClick={() => { setActiveTab('FARMER_OFFERS'); setStatusFilter('ALL'); }}
          role="button"
          tabIndex={0}
        >
          <span style={{ fontSize: '1.5rem' }}>🌾</span>
          <span className="agri-role-card-name" style={{ fontSize: '0.95rem' }}>
            Received Offers (Farmer View)
          </span>
          <span className="agri-role-card-desc">
            {receivedOffers.length} total received • {receivedOffers.filter(o => o.status === 'ACTIVE').length} awaiting action
          </span>
        </div>

        <div 
          className={`agri-role-option-card ${activeTab === 'BUYER_OFFERS' ? 'selected' : ''}`}
          style={{ flex: 1, minWidth: '220px', padding: '0.85rem' }}
          onClick={() => { setActiveTab('BUYER_OFFERS'); setStatusFilter('ALL'); }}
          role="button"
          tabIndex={0}
        >
          <span style={{ fontSize: '1.5rem' }}>🏪</span>
          <span className="agri-role-card-name" style={{ fontSize: '0.95rem' }}>
            My Submitted Offers (Buyer View)
          </span>
          <span className="agri-role-card-desc">
            {submittedOffers.length} offers submitted to farmers
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          type="button"
          className={`agri-nav-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          style={{ color: statusFilter === 'ALL' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: statusFilter === 'ALL' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({activeTab === 'FARMER_OFFERS' ? receivedOffers.length : submittedOffers.length})
        </button>

        <button 
          type="button"
          className={`agri-nav-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
          style={{ color: statusFilter === 'ACTIVE' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: statusFilter === 'ACTIVE' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setStatusFilter('ACTIVE')}
        >
          Active
        </button>

        <button 
          type="button"
          className={`agri-nav-btn ${statusFilter === 'ACCEPTED' ? 'active' : ''}`}
          style={{ color: statusFilter === 'ACCEPTED' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: statusFilter === 'ACCEPTED' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setStatusFilter('ACCEPTED')}
        >
          Accepted (Confirmed)
        </button>

        <button 
          type="button"
          className={`agri-nav-btn ${statusFilter === 'REJECTED' ? 'active' : ''}`}
          style={{ color: statusFilter === 'REJECTED' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: statusFilter === 'REJECTED' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected
        </button>

        {activeTab === 'BUYER_OFFERS' && (
          <button 
            type="button"
            className={`agri-nav-btn ${statusFilter === 'WITHDRAWN' ? 'active' : ''}`}
            style={{ color: statusFilter === 'WITHDRAWN' ? 'var(--color-forest-900)' : 'var(--color-soil-600)', background: statusFilter === 'WITHDRAWN' ? 'var(--color-sprout-100)' : 'transparent', border: '1px solid var(--color-border-subtle)' }}
            onClick={() => setStatusFilter('WITHDRAWN')}
          >
            Withdrawn
          </button>
        )}
      </div>

      {/* Offers Cards List */}
      {displayedOffers.length === 0 ? (
        <div className="market-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--color-canvas-bg)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📬</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-soil-900)', marginBottom: '0.25rem' }}>
            No offers found in this category
          </h3>
          <p style={{ color: 'var(--color-soil-600)', fontSize: '0.9rem' }}>
            {activeTab === 'FARMER_OFFERS' 
              ? 'New offers from buyers will appear here automatically.' 
              : 'You have not submitted any offers matching this filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {displayedOffers.map((offer) => {
            const totalVal = offer.quantity * offer.offeredPrice;
            const matchingDeal = deals.find(d => d.acceptedOfferId === offer.id);

            return (
              <div 
                key={offer.id}
                className="market-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', fontFamily: 'monospace' }}>
                      Offer Ref: {offer.id} • {new Date(offer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.2rem' }}>
                      {offer.listingProductName}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginTop: '0.25rem' }}>
                      {activeTab === 'FARMER_OFFERS' ? (
                        <span>From Buyer: <strong>{offer.buyerName}</strong> {offer.buyerType && `(${offer.buyerType})`}</span>
                      ) : (
                        <span>Submitted to Farmer: <strong>{offer.farmerName}</strong></span>
                      )}
                    </div>
                  </div>

                  <StatusPill status={offer.status} size="md" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--color-canvas-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Offered Rate</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-forest-900)' }} className="tabular-nums">
                      ₹{offer.offeredPrice.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ {offer.unit}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Requested Quantity</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-soil-900)' }} className="tabular-nums">
                      {offer.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{offer.unit}s</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase' }}>Total Offer Value</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-harvest-700)' }} className="tabular-nums">
                      ₹{totalVal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {offer.message && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', fontStyle: 'italic', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                    💬 Note: "{offer.message}"
                  </div>
                )}

                {/* Contextual Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {activeTab === 'FARMER_OFFERS' && offer.status === 'ACTIVE' && (
                    <>
                      <button 
                        type="button"
                        className="btn-secondary"
                        style={{ color: 'var(--color-terracotta-700)', borderColor: 'var(--color-terracotta-700)' }}
                        onClick={() => handleReject(offer.id)}
                      >
                        Reject Offer
                      </button>

                      <button 
                        type="button"
                        className="btn-primary"
                        onClick={() => handleAccept(offer.id, offer.listingProductName, offer.buyerName)}
                      >
                        <span>🤝</span> Accept Offer &amp; Confirm Deal
                      </button>
                    </>
                  )}

                  {activeTab === 'BUYER_OFFERS' && offer.status === 'ACTIVE' && (
                    <button 
                      type="button"
                      className="btn-secondary"
                      style={{ color: 'var(--color-terracotta-700)', borderColor: 'var(--color-terracotta-700)' }}
                      onClick={() => handleWithdraw(offer.id)}
                    >
                      Withdraw Offer
                    </button>
                  )}

                  {offer.status === 'ACCEPTED' && matchingDeal && (
                    <button 
                      type="button"
                      className="btn-primary"
                      onClick={() => navigateTo('deal_tracker', { dealId: matchingDeal.id })}
                    >
                      <span>🤝</span> View Deal Tracker (ID: {matchingDeal.id})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
