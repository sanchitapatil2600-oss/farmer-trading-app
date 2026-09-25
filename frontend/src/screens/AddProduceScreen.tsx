import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { ProduceListing } from '../data/types';

export const AddProduceScreen: React.FC = () => {
  const { currentUser, addListing, navigateTo } = useMarket();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProduceListing['category']>('Grains');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState<ProduceListing['unit']>('quintal');
  const [startingPrice, setStartingPrice] = useState<number | ''>('');
  const [availabilityDate, setAvailabilityDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [village, setVillage] = useState(currentUser?.village || 'Pimpalgaon Baswant');
  const [district, setDistrict] = useState(currentUser?.district || 'Nashik');
  const [state, setState] = useState(currentUser?.state || 'Maharashtra');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Embedded advisory benchmark helper
  const [showAdvisoryHelper, setShowAdvisoryHelper] = useState(false);

  const getAdvisoryRange = (cat: string) => {
    switch (cat) {
      case 'Grains': return '₹2,350 – ₹2,600 / quintal';
      case 'Vegetables': return '₹1,900 – ₹2,300 / quintal';
      case 'Pulses': return '₹4,900 – ₹5,400 / quintal';
      case 'Oilseeds': return '₹4,300 – ₹4,800 / quintal';
      case 'Fruits': return '₹8,500 – ₹10,500 / quintal';
      default: return '₹2,200 – ₹2,500 / quintal';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      setFormError('Please enter the crop / produce name.');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setFormError('Please specify a valid quantity greater than zero.');
      return;
    }

    if (!startingPrice || Number(startingPrice) <= 0) {
      setFormError('Please enter a valid positive starting price per unit.');
      return;
    }

    if (!availabilityDate) {
      setFormError('Please select a harvest readiness date.');
      return;
    }

    if (!village.trim() || !district.trim()) {
      setFormError('Please enter the farmgate village and district.');
      return;
    }

    setFormError(null);

    // Add listing to typed in-memory state with status ACTIVE
    addListing({
      productName: productName.trim(),
      category,
      quantity: Number(quantity),
      unit,
      startingPrice: Number(startingPrice),
      availabilityDate,
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🌱</span>
              <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: 0 }}>
                Add New Produce Listing
              </h1>
            </div>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Publish your agricultural harvest batch to the marketplace for verified buyers.
            </p>
          </div>

          <button 
            type="button"
            className="btn-secondary"
            onClick={() => navigateTo('my_listings')}
          >
            ← My Listings
          </button>
        </div>
      </div>

      <div className="market-card">
        {formError && (
          <div className="agri-alert agri-alert-error" role="alert">
            <span>⚠️</span>
            <div>{formError}</div>
          </div>
        )}

        {/* Farmgate Privacy Notice */}
        <div className="agri-alert agri-alert-privacy">
          <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          <div>
            <strong>Farmgate Privacy Policy:</strong> In accordance with security guidelines, 
            your exact residential door number or farm plot survey number is protected and <strong>never publicly displayed</strong>. 
            Public produce cards show only your general <em>Village/Locality</em> and <em>District</em>.
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Produce Name & Category */}
          <div className="agri-form-row">
            <div className="agri-form-group">
              <label htmlFor="produce-name" className="agri-label">
                Crop / Produce Name <span className="agri-label-required">*</span>
              </label>
              <input 
                id="produce-name"
                type="text"
                className="agri-input"
                placeholder="e.g. Sharbati Golden Wheat"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
              <div className="agri-helper-text">
                Specify variety or grade if known (e.g. Garwa Grade, Basmati 1121).
              </div>
            </div>

            <div className="agri-form-group">
              <label htmlFor="produce-category" className="agri-label">
                Agricultural Category <span className="agri-label-required">*</span>
              </label>
              <select 
                id="produce-category"
                className="agri-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                required
              >
                <option value="Grains">Grains (Wheat, Rice, Maize, etc.)</option>
                <option value="Vegetables">Vegetables (Onion, Potato, Tomato, etc.)</option>
                <option value="Pulses">Pulses (Chana, Tur, Moong, etc.)</option>
                <option value="Oilseeds">Oilseeds (Soybean, Mustard, Groundnut, etc.)</option>
                <option value="Fruits">Fruits (Mango, Pomegranate, Banana, etc.)</option>
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="agri-form-row">
            <div className="agri-form-group">
              <label htmlFor="produce-qty" className="agri-label">
                Total Available Quantity <span className="agri-label-required">*</span>
              </label>
              <input 
                id="produce-qty"
                type="number"
                min="1"
                className="agri-input tabular-nums"
                placeholder="e.g. 150"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>

            <div className="agri-form-group">
              <label htmlFor="produce-unit" className="agri-label">
                Measurement Unit <span className="agri-label-required">*</span>
              </label>
              <select 
                id="produce-unit"
                className="agri-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                required
              >
                <option value="quintal">quintal (100 kg)</option>
                <option value="kg">kilogram (kg)</option>
                <option value="tonne">tonne (1,000 kg)</option>
              </select>
            </div>
          </div>

          {/* Expected Rate & Advisory Helper */}
          <div className="agri-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
              <label htmlFor="produce-price" className="agri-label" style={{ margin: 0 }}>
                Starting Expected Rate per {unit} (₹) <span className="agri-label-required">*</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowAdvisoryHelper(!showAdvisoryHelper)}
                style={{ background: 'none', border: 'none', color: 'var(--color-harvest-700)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {showAdvisoryHelper ? 'Hide Mandi Advisory' : '🤖 Check Advisory Mandi Benchmark'}
              </button>
            </div>

            <input 
              id="produce-price"
              type="number"
              min="1"
              className="agri-input tabular-nums"
              placeholder="e.g. 2450"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value ? Number(e.target.value) : '')}
              required
            />

            {/* Embedded Advisory Benchmark Snapshot */}
            {showAdvisoryHelper && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'var(--color-amber-100)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-amber-600)', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '0.2rem' }}>
                  AI Advisory Mandi Estimate ({category}):
                </div>
                <div style={{ color: 'var(--color-forest-900)', fontWeight: 800, fontSize: '1.1rem' }} className="tabular-nums">
                  {getAdvisoryRange(category)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '0.25rem' }}>
                  * Advisory benchmark based on regional historical trends. Non-binding estimate.
                </div>
              </div>
            )}
          </div>

          {/* Availability Date */}
          <div className="agri-form-group">
            <label htmlFor="produce-date" className="agri-label">
              Harvest Readiness / Availability Date <span className="agri-label-required">*</span>
            </label>
            <input 
              id="produce-date"
              type="date"
              className="agri-input"
              value={availabilityDate}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              required
            />
            <div className="agri-helper-text">
              Date when the produce will be ready for vehicle pickup at farmgate.
            </div>
          </div>

          {/* Farmgate Locality */}
          <div className="agri-form-row">
            <div className="agri-form-group">
              <label htmlFor="produce-village" className="agri-label">
                Village / Locality <span className="agri-label-required">*</span>
              </label>
              <input 
                id="produce-village"
                type="text"
                className="agri-input"
                placeholder="e.g. Pimpalgaon Baswant"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                required
              />
            </div>

            <div className="agri-form-group">
              <label htmlFor="produce-district" className="agri-label">
                Mandi District <span className="agri-label-required">*</span>
              </label>
              <input 
                id="produce-district"
                type="text"
                className="agri-input"
                placeholder="e.g. Nashik"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="agri-form-group">
            <label htmlFor="produce-state" className="agri-label">
              State <span className="agri-label-required">*</span>
            </label>
            <select 
              id="produce-state"
              className="agri-select"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Rajasthan">Rajasthan</option>
            </select>
          </div>

          {/* Description & Packaging Notes */}
          <div className="agri-form-group">
            <label htmlFor="produce-desc" className="agri-label">
              Harvest Description &amp; Storage Conditions (Optional)
            </label>
            <textarea 
              id="produce-desc"
              rows={3}
              className="agri-textarea"
              placeholder="e.g. Sun-dried naturally, cleaned and graded, stored in moisture-proof gunny bags..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => navigateTo('my_listings')}
            >
              Cancel
            </button>

            <button 
              type="submit"
              className="btn-primary"
              style={{ minHeight: '48px', padding: '0.75rem 1.75rem', fontSize: '1rem' }}
            >
              <span>🌱</span> Publish Produce Listing (Active)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
