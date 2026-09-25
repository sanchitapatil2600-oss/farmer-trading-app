import React from 'react';
import { DeliveryStatus } from '../../data/types';

interface DeliveryStatusTrackerProps {
  status: DeliveryStatus;
}

export const DeliveryStatusTracker: React.FC<DeliveryStatusTrackerProps> = ({ status }) => {
  const steps: { key: DeliveryStatus; label: string; num: number }[] = [
    { key: 'PENDING', label: 'PENDING', num: 1 },
    { key: 'PICKUP_SCHEDULED', label: 'PICKUP_SCHEDULED', num: 2 },
    { key: 'PICKED_UP', label: 'PICKED_UP', num: 3 },
    { key: 'IN_TRANSIT', label: 'IN_TRANSIT', num: 4 },
    { key: 'DELIVERED', label: 'DELIVERED', num: 5 },
  ];

  const getStepIndex = (s: DeliveryStatus): number => {
    switch (s) {
      case 'PENDING': return 0;
      case 'PICKUP_SCHEDULED': return 1;
      case 'PICKED_UP': return 2;
      case 'IN_TRANSIT': return 3;
      case 'DELIVERED': return 4;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isCancelled = status === 'CANCELLED';

  const getStatusPrompt = (s: DeliveryStatus) => {
    switch (s) {
      case 'PENDING':
        return 'Delivery record created. Awaiting pickup schedule confirmation.';
      case 'PICKUP_SCHEDULED':
        return 'Farmgate pickup date and vehicle designated.';
      case 'PICKED_UP':
        return 'Produce loaded at farmer location and dispatched.';
      case 'IN_TRANSIT':
        return 'Consignment traveling through direct transport corridor.';
      case 'DELIVERED':
        return 'Produce arrived at destination hub and verified by recipient.';
      case 'CANCELLED':
        return 'Delivery logistics cancelled.';
      default:
        return '';
    }
  };

  return (
    <div style={{ margin: '1rem 0 1.5rem 0' }}>
      {isCancelled ? (
        <div className="agri-alert agri-alert-error" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '1.25rem' }}>❌</span>
          <div>
            <strong>Delivery Status: CANCELLED</strong> — This logistics shipment has been cancelled.
          </div>
        </div>
      ) : (
        <>
          <div className="lifecycle-tracker" style={{ paddingBottom: '0.5rem' }}>
            {steps.map((step, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              let stepColor = 'var(--color-soil-600)';
              let indicatorBg = 'var(--color-slate-100)';
              let indicatorColor = 'var(--color-soil-600)';

              if (isPast) {
                stepColor = 'var(--color-forest-900)';
                indicatorBg = 'var(--color-sprout-100)';
                indicatorColor = 'var(--color-forest-900)';
              } else if (isCurrent) {
                stepColor = 'var(--color-forest-900)';
                indicatorBg = 'var(--color-harvest-600)';
                indicatorColor = '#FFFFFF';
              }

              return (
                <React.Fragment key={step.key}>
                  <div className={`lifecycle-step ${isCurrent ? 'active' : ''}`} style={{ color: stepColor }}>
                    <span 
                      className="step-indicator"
                      style={{ 
                        backgroundColor: indicatorBg, 
                        color: indicatorColor,
                        fontWeight: 700,
                        border: isPast || isCurrent ? '1px solid var(--color-harvest-600)' : '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {isPast ? '✓' : step.num}
                    </span>
                    <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.8rem' }}>
                      {step.label}
                    </span>
                  </div>

                  {idx < steps.length - 1 && (
                    <span className="step-arrow" style={{ color: isPast ? 'var(--color-harvest-600)' : 'var(--color-border-strong)' }}>
                      ►
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-soil-600)', background: 'var(--color-canvas-bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
            <strong>Milestone Status:</strong> {getStatusPrompt(status)}
          </div>
        </>
      )}
    </div>
  );
};
