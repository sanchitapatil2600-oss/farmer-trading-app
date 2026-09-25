import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { DeliveryStatusTracker } from '../components/common/DeliveryStatusTracker';
import { StatusPill } from '../components/common/StatusPill';
import { DeliveryStatus } from '../data/types';

export const DeliveryStatusScreen: React.FC = () => {
  const { deals, deliveries, selectedDealId, updateDeliveryStatus, updateDealStatus, navigateTo } = useMarket();

  // Selected deal or default to first
  const currentDealId = selectedDealId || (deals.length > 0 ? deals[0].id : null);
  const deal = deals.find(d => d.id === currentDealId) || deals[0];
  const delivery = deliveries.find(del => del.dealId === deal?.id);

  const [notification, setNotification] = useState<string | null>(null);

  if (!deal || !delivery) {
    return (
      <div className="market-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>No delivery records available</h2>
        <button type="button" className="btn-primary" onClick={() => navigateTo('farmer_dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleAdvanceDelivery = (nextStatus: DeliveryStatus) => {
    updateDeliveryStatus(delivery.id, nextStatus);
    if (nextStatus === 'DELIVERED') {
      updateDealStatus(deal.id, 'COMPLETED');
      setNotification('Delivery status marked as DELIVERED. Deal marked as COMPLETED.');
    } else {
      updateDealStatus(deal.id, 'DELIVERY');
      setNotification(`Delivery status updated to ${nextStatus}.`);
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
              <span style={{ fontSize: '1.5rem' }}>🚛</span>
              <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: 0 }}>
                Delivery &amp; Farmgate Pickup Status
              </h1>
            </div>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Milestone tracking for produce dispatch from farmgate cluster to buyer destination.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {deals.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="delivery-deal-select" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-soil-600)' }}>
                  Deal:
                </label>
                <select 
                  id="delivery-deal-select"
                  className="agri-select"
                  style={{ minHeight: '40px', padding: '0.25rem 0.5rem', width: 'auto' }}
                  value={deal.id}
                  onChange={(e) => navigateTo('delivery_status', { dealId: e.target.value })}
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

      {notification && (
        <div className="agri-alert agri-alert-info" role="alert">
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div>{notification}</div>
        </div>
      )}

      {/* Sequential Milestone Progress Tracker */}
      <div className="market-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-forest-900)' }}>
              Logistics Milestone Pipeline
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
              Sequential milestone progression for this harvest consignment.
            </p>
          </div>
          <StatusPill status={delivery.status} size="md" />
        </div>

        {/* Milestone Tracker Component */}
        <DeliveryStatusTracker status={delivery.status} />

        {/* Demonstration Milestone Controls */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-soil-600)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            ⚙️ Demonstration Milestone Progression (Mentor Review)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {delivery.status === 'PENDING' && (
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => handleAdvanceDelivery('PICKUP_SCHEDULED')}
              >
                Mark as PICKUP_SCHEDULED ►
              </button>
            )}

            {delivery.status === 'PICKUP_SCHEDULED' && (
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => handleAdvanceDelivery('PICKED_UP')}
              >
                Mark as PICKED_UP (Dispatched from Farm) ►
              </button>
            )}

            {delivery.status === 'PICKED_UP' && (
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => handleAdvanceDelivery('IN_TRANSIT')}
              >
                Mark as IN_TRANSIT (In Corridor) ►
              </button>
            )}

            {delivery.status === 'IN_TRANSIT' && (
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => handleAdvanceDelivery('DELIVERED')}
              >
                Mark as DELIVERED (Received at Destination) ✓
              </button>
            )}

            {delivery.status === 'DELIVERED' && (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-forest-900)', fontWeight: 600, padding: '0.5rem 0' }}>
                ✓ Delivery milestone complete. Deal has reached COMPLETED status.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logistics & Route Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Consignment Details */}
        <div className="market-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
            Consignment &amp; Transport Specifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Produce Batch:</span>
              <strong>{deal.productName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Transport Quantity:</span>
              <strong className="tabular-nums">{deal.quantity} {deal.unit}s</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Vehicle Designation:</span>
              <strong>{delivery.vehicleType || 'Standard Agricultural Cargo Truck'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-soil-600)' }}>Scheduled Pickup Date:</span>
              <span>{delivery.pickupDate ? new Date(delivery.pickupDate).toLocaleString('en-IN') : 'Coordinated upon payment'}</span>
            </div>

            {delivery.transporterNotes && (
              <div style={{ background: 'var(--color-canvas-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
                <strong>Logistics Notes:</strong> {delivery.transporterNotes}
              </div>
            )}
          </div>
        </div>

        {/* Route Corridor & Privacy Masking */}
        <div className="market-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
            Corridor Route &amp; Privacy Safeguards
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>Origin Cluster</div>
                <div style={{ fontWeight: 700, color: 'var(--color-soil-900)' }}>{delivery.originVillage}, {delivery.originDistrict}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>Farmgate dispatch cluster</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '1.5rem' }}>🏢</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>Destination Hub</div>
                <div style={{ fontWeight: 700, color: 'var(--color-soil-900)' }}>{delivery.destinationCity}, {delivery.destinationDistrict}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)' }}>Buyer distribution warehouse</div>
              </div>
            </div>

            {/* Scope Guard: No Fake GPS Tracking */}
            <div className="agri-alert agri-alert-privacy" style={{ margin: 0 }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div>
                <strong>Milestone-Based Tracking:</strong> In accordance with PRD Section 14 and Architecture boundaries, 
                AgriHub+ deliberately avoids fake animated GPS map tracking. Deliveries are recorded via authentic verified system milestones.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
