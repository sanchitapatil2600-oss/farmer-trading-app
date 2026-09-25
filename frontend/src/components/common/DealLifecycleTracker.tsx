import React from 'react';
import { DealStatus } from '../../data/types';

interface DealLifecycleTrackerProps {
  status: DealStatus;
}

export const DealLifecycleTracker: React.FC<DealLifecycleTrackerProps> = ({ status }) => {
  const steps: { key: DealStatus; label: string; num: number }[] = [
    { key: 'CONFIRMED', label: 'CONFIRMED', num: 1 },
    { key: 'PAYMENT_PENDING', label: 'PAYMENT_PENDING', num: 2 },
    { key: 'PAID', label: 'PAID', num: 3 },
    { key: 'DELIVERY', label: 'DELIVERY', num: 4 },
    { key: 'COMPLETED', label: 'COMPLETED', num: 5 },
  ];

  const getStepIndex = (s: DealStatus): number => {
    switch (s) {
      case 'CONFIRMED': return 0;
      case 'PAYMENT_PENDING': return 1;
      case 'PAID': return 2;
      case 'DELIVERY': return 3;
      case 'COMPLETED': return 4;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isCancelled = status === 'CANCELLED';

  const getStatusPrompt = (s: DealStatus) => {
    switch (s) {
      case 'CONFIRMED':
        return 'Deal created after farmer accepts offer. Awaiting payment initiation.';
      case 'PAYMENT_PENDING':
        return 'Payment request generated with external gateway. Proceed to payment.';
      case 'PAID':
        return 'Payment verified by backend server. Farmgate pickup being scheduled.';
      case 'DELIVERY':
        return 'Goods in active logistics coordination. Pickup & transit underway.';
      case 'COMPLETED':
        return 'Produce successfully delivered and transaction finalized.';
      case 'CANCELLED':
        return 'Deal cancelled in accordance with trading rules.';
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
            <strong>Deal Status: CANCELLED</strong> — This commercial transaction has been terminated.
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
            <strong>Current Stage:</strong> {getStatusPrompt(status)}
          </div>
        </>
      )}
    </div>
  );
};
