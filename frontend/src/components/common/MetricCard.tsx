import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
}) => {
  return (
    <div 
      className="market-card"
      style={{
        padding: '1.25rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-soil-600)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {title}
        </span>
        <span style={{ fontSize: '1.5rem', background: 'var(--color-sprout-50)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }} aria-hidden="true">
          {icon}
        </span>
      </div>

      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-forest-900)', lineHeight: 1.1, marginBottom: '0.35rem' }} className="tabular-nums">
        {value}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-soil-600)' }}>
        <span>{subtitle}</span>
        {trend && (
          <span style={{ color: 'var(--color-harvest-700)', fontWeight: 600 }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
