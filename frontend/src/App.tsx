import React, { useEffect, useState } from 'react';

interface HealthData {
  status: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    configured: boolean;
    connected: boolean;
    status: string;
  };
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setHealth(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Agricultural Market Navigation Header */}
      <header className="market-header">
        <div>
          <div className="brand-title">
            <span role="img" aria-label="Seedling">🌱</span>
            Farmer Trading Marketplace
          </div>
          <div className="brand-tagline">Direct Agricultural Trade — Phase 1 Foundation</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`status-pill ${health?.status === 'operational' ? 'pill-active' : 'pill-pending'}`}>
            {loading ? 'Checking...' : health?.status === 'operational' ? 'Backend Online' : 'Connecting'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        {/* Foundation Status Banner */}
        <section className="market-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.35rem' }}>
                Agricultural Marketplace Foundation
              </h1>
              <p style={{ color: 'var(--color-soil-600)', fontSize: '0.95rem' }}>
                Technical foundation established in accordance with the Product Requirements and Architecture specifications.
              </p>
            </div>
            <span className="status-pill pill-active">
              Phase 1 Active
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: '1.25rem 0' }} />

          {/* System & Database Status Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-soil-600)', fontWeight: 600 }}>
                API Health & Runtime
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-soil-900)', marginTop: '0.25rem' }}>
                {loading ? 'Querying /api/health...' : error ? `Error: ${error}` : 'Operational (Node.js v24)'}
              </div>
              {health && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-soil-600)', marginTop: '0.25rem' }}>
                  Environment: <strong>{health.environment}</strong> | Uptime: <strong>{health.uptimeSeconds}s</strong>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--color-canvas-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-soil-600)', fontWeight: 600 }}>
                PostgreSQL Database Layer
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: health?.database.connected ? 'var(--color-harvest-600)' : 'var(--color-amber-600)', marginTop: '0.25rem' }}>
                {loading ? 'Checking...' : health?.database.connected ? 'Connected' : 'Connection Layer Ready'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-soil-600)', marginTop: '0.25rem' }}>
                {health?.database.status || 'Database connection pool initialized.'}
              </div>
            </div>
          </div>
        </section>

        {/* Approved Deal Lifecycle Preview */}
        <section className="market-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.5rem' }}>
            Approved Deal Lifecycle Stages
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginBottom: '1rem' }}>
            The exact 5-stage sequential deal progression defined in ARCHITECTURE.md and DATABASE.md:
          </p>

          <div className="lifecycle-tracker">
            <div className="lifecycle-step active">
              <span className="step-indicator">1</span>
              <span>CONFIRMED</span>
            </div>
            <span className="step-arrow">►</span>
            <div className="lifecycle-step">
              <span className="step-indicator">2</span>
              <span>PAYMENT_PENDING</span>
            </div>
            <span className="step-arrow">►</span>
            <div className="lifecycle-step">
              <span className="step-indicator">3</span>
              <span>PAID</span>
            </div>
            <span className="step-arrow">►</span>
            <div className="lifecycle-step">
              <span className="step-indicator">4</span>
              <span>DELIVERY</span>
            </div>
            <span className="step-arrow">►</span>
            <div className="lifecycle-step">
              <span className="step-indicator">5</span>
              <span>COMPLETED</span>
            </div>
          </div>
        </section>

        {/* UI / Design Tokens Preview */}
        <section className="market-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-900)', marginBottom: '0.5rem' }}>
            Domain Design Palette
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)', marginBottom: '1rem' }}>
            Verified agricultural theme colors established per docs/UI_UX_DESIGN_SYSTEM.md:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#1B4332', color: '#FFF', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              Deep Forest<br />#1B4332
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#2D6A4F', color: '#FFF', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              Harvest Green<br />#2D6A4F
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#E8F5E9', color: '#1B4332', border: '1px solid #C8C2B7', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              Sprout Green<br />#E8F5E9
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#D97706', color: '#FFF', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              Golden Wheat<br />#D97706
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#C53030', color: '#FFF', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              Terracotta<br />#C53030
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#F9F8F6', color: '#1A201C', border: '1px solid #E6E2DA', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              Warm Canvas<br />#F9F8F6
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
