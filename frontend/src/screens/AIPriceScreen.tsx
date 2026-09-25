import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';

export const AIPriceScreen: React.FC = () => {
  const { navigateTo } = useMarket();

  const [selectedCrop, setSelectedCrop] = useState('Sharbati Golden Wheat');
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState<'quintal' | 'kg' | 'tonne'>('quintal');
  const [district, setDistrict] = useState('Nashik');
  
  // Toggle to demonstrate the approved Insufficient Market Data fallback
  const [simulateInsufficientData, setSimulateInsufficientData] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(true);

  // Advisory benchmark benchmarks based on selected crop
  const getAdvisoryBenchmark = (crop: string) => {
    switch (crop) {
      case 'Sharbati Golden Wheat':
        return { min: 2350, max: 2550, base: 2450, source: 'Nashik & MP Mandi Historical Weekly Feed' };
      case 'Nashik Red Onion (Garwa Grade)':
        return { min: 2050, max: 2250, base: 2150, source: 'Lasalgaon APMC Benchmark Historical Feed' };
      case 'Basmati 1121 Extra Long Grain Paddy':
        return { min: 3650, max: 3950, base: 3800, source: 'Karnal & Taraori Mandi Historical Data' };
      case 'Yellow Soybean (JS 335)':
        return { min: 4400, max: 4750, base: 4600, source: 'Akola & Vidarbha Mandi Benchmark Feed' };
      case 'Desi Chana (Bengal Gram)':
        return { min: 5050, max: 5350, base: 5200, source: 'Central India Pulses Historical Data' };
      default:
        return { min: 2100, max: 2400, base: 2250, source: 'Regional APMC Benchmark Feed' };
    }
  };

  const benchmark = getAdvisoryBenchmark(selectedCrop);
  const minTotal = quantity * benchmark.min;
  const maxTotal = quantity * benchmark.max;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setHasCalculated(true);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: 0 }}>
                AI Price Recommendation
              </h1>
              <span className="status-pill pill-pending" style={{ fontSize: '0.75rem' }}>
                Advisory Only
              </span>
            </div>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Advisory pricing estimates based on regional mandi market benchmarks to help guide negotiations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigateTo('farmer_dashboard')}
            >
              Dashboard
            </button>
            <button 
              type="button" 
              className="btn-primary"
              onClick={() => navigateTo('marketplace')}
            >
              Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Input Parameters Form */}
        <div className="market-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-soil-900)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
            Advisory Parameters
          </h2>

          <form onSubmit={handleCalculate}>
            <div className="agri-form-group">
              <label htmlFor="advisory-crop" className="agri-label">
                Crop / Agricultural Produce <span className="agri-label-required">*</span>
              </label>
              <select 
                id="advisory-crop"
                className="agri-select"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                <option value="Sharbati Golden Wheat">Sharbati Golden Wheat</option>
                <option value="Nashik Red Onion (Garwa Grade)">Nashik Red Onion (Garwa Grade)</option>
                <option value="Basmati 1121 Extra Long Grain Paddy">Basmati 1121 Extra Long Grain Paddy</option>
                <option value="Yellow Soybean (JS 335)">Yellow Soybean (JS 335)</option>
                <option value="Desi Chana (Bengal Gram)">Desi Chana (Bengal Gram)</option>
              </select>
            </div>

            <div className="agri-form-row">
              <div className="agri-form-group">
                <label htmlFor="advisory-quantity" className="agri-label">
                  Batch Quantity <span className="agri-label-required">*</span>
                </label>
                <input 
                  id="advisory-quantity"
                  type="number"
                  min="1"
                  className="agri-input tabular-nums"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <div className="agri-form-group">
                <label htmlFor="advisory-unit" className="agri-label">
                  Unit <span className="agri-label-required">*</span>
                </label>
                <select 
                  id="advisory-unit"
                  className="agri-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                >
                  <option value="quintal">quintal (100 kg)</option>
                  <option value="kg">kilogram (kg)</option>
                  <option value="tonne">tonne (1,000 kg)</option>
                </select>
              </div>
            </div>

            <div className="agri-form-group">
              <label htmlFor="advisory-district" className="agri-label">
                Regional Mandi District <span className="agri-label-required">*</span>
              </label>
              <select 
                id="advisory-district"
                className="agri-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="Nashik">Nashik (Maharashtra)</option>
                <option value="Karnal">Karnal (Haryana)</option>
                <option value="Akola">Akola (Maharashtra)</option>
                <option value="Pune">Pune (Maharashtra)</option>
                <option value="Indore">Indore (Madhya Pradesh)</option>
              </select>
            </div>

            {/* Demonstration Test Toggle: Insufficient Market Data Fallback */}
            <div style={{ background: 'var(--color-canvas-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-soil-900)' }}>
                <input 
                  type="checkbox"
                  checked={simulateInsufficientData}
                  onChange={(e) => setSimulateInsufficientData(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Simulate "Insufficient Market Data" Fallback
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', marginTop: '0.35rem' }}>
                Demonstrates that AgriHub+ gracefully declines to fabricate a price when verified historical data is unavailable.
              </div>
            </div>

            <button 
              type="submit"
              className="btn-primary"
              style={{ width: '100%', minHeight: '48px' }}
            >
              <span>🤖</span> Calculate Advisory Price Band
            </button>
          </form>
        </div>

        {/* Advisory Output Display Card */}
        <div className="market-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-900)' }}>
              Advisory Estimate Result
            </h2>
            <span className="status-pill pill-pending">
              Non-Guaranteed
            </span>
          </div>

          {simulateInsufficientData ? (
            /* Section 6.5 Graceful Fallback State */
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center', background: 'var(--color-amber-100)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-amber-600)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>⚠️</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#92400E', marginBottom: '0.5rem' }}>
                Market Estimate Unavailable
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#92400E', lineHeight: 1.5, marginBottom: '1rem' }}>
                Insufficient verified market benchmark data exists to generate a reliable price recommendation for this crop and location combination.
              </p>
              <div style={{ fontSize: '0.8rem', color: '#78350F', background: 'rgba(255, 255, 255, 0.7)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Zero-Hallucination Policy:</strong> The application refuses to fabricate an arbitrary market rate. The farmer and buyer remain free to agree on terms directly.
              </div>
            </div>
          ) : hasCalculated ? (
            /* Standard Advisory Range Display */
            <div>
              <div style={{ padding: '1.25rem', background: 'var(--color-sprout-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sprout-100)', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Suggested Regional Market Band
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-forest-900)', marginTop: '0.35rem' }} className="tabular-nums">
                  ₹{benchmark.min.toLocaleString('en-IN')} – ₹{benchmark.max.toLocaleString('en-IN')}{' '}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-soil-600)' }}>/ {unit}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-harvest-700)', fontWeight: 600, marginTop: '0.35rem' }}>
                  Midpoint Benchmark: ₹{benchmark.base.toLocaleString('en-IN')} / {unit}
                </div>
              </div>

              <div style={{ background: 'var(--color-canvas-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Estimated Batch Valuation ({quantity} {unit}s)
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-soil-900)' }} className="tabular-nums">
                  ₹{minTotal.toLocaleString('en-IN')} – ₹{maxTotal.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-soil-600)', marginTop: '0.35rem' }}>
                  Source: <strong>{benchmark.source}</strong> ({district} Region)
                </div>
              </div>

              {/* Mandatory Prominent Disclaimer */}
              <div className="agri-alert agri-alert-warning" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.45 }}>
                <span>⚠️</span>
                <div>
                  <strong>Advisory Only Disclaimer:</strong> This estimate is based on available regional market trends. 
                  It is <strong>not</strong> an official government rate or guaranteed Minimum Support Price (MSP). 
                  It does not claim to represent real-time guaranteed live prices. Final commercial terms are negotiated solely between farmer and buyer.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
