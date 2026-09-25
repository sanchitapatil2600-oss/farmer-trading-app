import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { UserRole } from '../data/types';

export const RegisterScreen: React.FC = () => {
  const { register, navigateTo } = useMarket();
  const [selectedRole, setSelectedRole] = useState<UserRole>('FARMER');

  // Common fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('');

  // Farmer-specific field
  const [village, setVillage] = useState('');

  // Buyer-specific fields
  const [organizationName, setOrganizationName] = useState('');
  const [buyerType, setBuyerType] = useState<'Wholesaler' | 'Retailer' | 'Consumer' | 'Food Processor' | 'Agricultural Business'>('Wholesaler');
  const [city, setCity] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your 10-digit mobile phone number.');
      return;
    }
    if (!district.trim()) {
      setError('Please specify your district.');
      return;
    }

    if (selectedRole === 'FARMER') {
      if (!village.trim()) {
        setError('Please enter your village or locality name.');
        return;
      }
    } else {
      if (!organizationName.trim()) {
        setError('Please enter your business or firm name.');
        return;
      }
      if (!city.trim()) {
        setError('Please enter your operating city or market yard locality.');
        return;
      }
    }

    if (!password.trim() || password.length < 6) {
      setError('Please choose a secure password with at least 6 characters.');
      return;
    }

    setError(null);

    // Register in in-memory state
    register({
      role: selectedRole,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      state: state.trim(),
      district: district.trim(),
      village: selectedRole === 'FARMER' ? village.trim() : undefined,
      organizationName: selectedRole === 'BUYER' ? organizationName.trim() : undefined,
      buyerType: selectedRole === 'BUYER' ? buyerType : undefined,
      city: selectedRole === 'BUYER' ? city.trim() : undefined,
    });
  };

  return (
    <div className="agri-auth-wrap" style={{ maxWidth: '640px' }}>
      <div className="agri-auth-card">
        <div className="agri-auth-header">
          <span style={{ fontSize: '2.5rem' }} aria-hidden="true">🌾</span>
          <h1 className="agri-auth-title">Create an AgriHub+ Account</h1>
          <p className="agri-auth-subtitle">
            Join the direct agricultural trading marketplace
          </p>
        </div>

        {/* Phase Demonstration Disclaimer */}
        <div className="agri-alert agri-alert-warning" style={{ fontSize: '0.8rem' }}>
          <span>⚠️</span>
          <div>
            <strong>Frontend Demonstration Mode:</strong> Registration is UI-only in this phase. 
            No data is submitted to a remote server. Completing this form sets up a typed in-memory session for review.
          </div>
        </div>

        {/* Mandatory Address Privacy Notice */}
        <div className="agri-alert agri-alert-privacy">
          <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          <div>
            <strong>Farmgate Privacy Policy:</strong> In accordance with security & privacy regulations, 
            your exact residential address or farm survey coordinates are protected and <strong>never publicly displayed</strong>. 
            Public listings show only your general <em>Village/Locality</em> and <em>District</em>.
          </div>
        </div>

        {error && (
          <div className="agri-alert agri-alert-error" role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role Chooser Cards */}
          <div className="agri-form-group">
            <label className="agri-label">
              Select Your Marketplace Role <span className="agri-label-required">*</span>
            </label>
            <div className="agri-role-cards-grid">
              <div 
                className={`agri-role-option-card ${selectedRole === 'FARMER' ? 'selected' : ''}`}
                onClick={() => setSelectedRole('FARMER')}
                role="radio"
                aria-checked={selectedRole === 'FARMER'}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRole('FARMER'); }}
              >
                <span className="agri-role-card-icon">🌾</span>
                <span className="agri-role-card-name">Farmer (Kisan)</span>
                <span className="agri-role-card-desc">
                  List harvest produce directly, get AI price guidance, and negotiate with verified buyers.
                </span>
              </div>

              <div 
                className={`agri-role-option-card ${selectedRole === 'BUYER' ? 'selected' : ''}`}
                onClick={() => setSelectedRole('BUYER')}
                role="radio"
                aria-checked={selectedRole === 'BUYER'}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRole('BUYER'); }}
              >
                <span className="agri-role-card-icon">🏪</span>
                <span className="agri-role-card-name">Buyer (Vyapari)</span>
                <span className="agri-role-card-desc">
                  Discover fresh produce from mandi regions, submit direct bids, and schedule farmgate pickup.
                </span>
              </div>
            </div>
          </div>

          {/* Role Specific Forms */}
          {selectedRole === 'FARMER' ? (
            <>
              <div className="agri-form-group">
                <label htmlFor="farmer-name" className="agri-label">
                  Farmer Full Name <span className="agri-label-required">*</span>
                </label>
                <input 
                  id="farmer-name"
                  type="text"
                  className="agri-input"
                  placeholder="e.g. Ramesh Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="agri-form-row">
                <div className="agri-form-group">
                  <label htmlFor="farmer-phone" className="agri-label">
                    Mobile Phone Number <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="farmer-phone"
                    type="tel"
                    className="agri-input"
                    placeholder="e.g. 9823045678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="agri-form-group">
                  <label htmlFor="farmer-email" className="agri-label">
                    Email Address (Optional)
                  </label>
                  <input 
                    id="farmer-email"
                    type="email"
                    className="agri-input"
                    placeholder="e.g. ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="agri-form-row">
                <div className="agri-form-group">
                  <label htmlFor="farmer-village" className="agri-label">
                    Village / Locality <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="farmer-village"
                    type="text"
                    className="agri-input"
                    placeholder="e.g. Pimpalgaon Baswant"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    required
                  />
                </div>

                <div className="agri-form-group">
                  <label htmlFor="farmer-district" className="agri-label">
                    District <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="farmer-district"
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
                <label htmlFor="farmer-state" className="agri-label">
                  State <span className="agri-label-required">*</span>
                </label>
                <select 
                  id="farmer-state"
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
            </>
          ) : (
            <>
              <div className="agri-form-row">
                <div className="agri-form-group">
                  <label htmlFor="buyer-name" className="agri-label">
                    Contact Person Name <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="buyer-name"
                    type="text"
                    className="agri-input"
                    placeholder="e.g. Suresh Mehta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="agri-form-group">
                  <label htmlFor="buyer-org" className="agri-label">
                    Business / Firm Name <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="buyer-org"
                    type="text"
                    className="agri-input"
                    placeholder="e.g. Kisan Fresh Wholesale Mart"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="agri-form-group">
                <label htmlFor="buyer-type" className="agri-label">
                  Buyer Category <span className="agri-label-required">*</span>
                </label>
                <select 
                  id="buyer-type"
                  className="agri-select"
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as any)}
                  required
                >
                  <option value="Wholesaler">Wholesaler / Mandi Trader</option>
                  <option value="Retailer">Retailer / Supermarket</option>
                  <option value="Food Processor">Food Processing Unit</option>
                  <option value="Agricultural Business">Agricultural Business / Export</option>
                  <option value="Consumer">Individual Bulk Consumer</option>
                </select>
              </div>

              <div className="agri-form-row">
                <div className="agri-form-group">
                  <label htmlFor="buyer-phone" className="agri-label">
                    Mobile Phone Number <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="buyer-phone"
                    type="tel"
                    className="agri-input"
                    placeholder="e.g. 9845012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="agri-form-group">
                  <label htmlFor="buyer-email" className="agri-label">
                    Email Address (Optional)
                  </label>
                  <input 
                    id="buyer-email"
                    type="email"
                    className="agri-input"
                    placeholder="e.g. procurement@kisanfresh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="agri-form-row">
                <div className="agri-form-group">
                  <label htmlFor="buyer-city" className="agri-label">
                    City / Mandi Hub <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="buyer-city"
                    type="text"
                    className="agri-input"
                    placeholder="e.g. Vashi, Navi Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="agri-form-group">
                  <label htmlFor="buyer-district" className="agri-label">
                    District <span className="agri-label-required">*</span>
                  </label>
                  <input 
                    id="buyer-district"
                    type="text"
                    className="agri-input"
                    placeholder="e.g. Thane"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="agri-form-group">
                <label htmlFor="buyer-state" className="agri-label">
                  State <span className="agri-label-required">*</span>
                </label>
                <select 
                  id="buyer-state"
                  className="agri-select"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Punjab">Punjab</option>
                </select>
              </div>
            </>
          )}

          {/* Password Input */}
          <div className="agri-form-group">
            <label htmlFor="register-password" className="agri-label">
              Set Account Password <span className="agri-label-required">*</span>
            </label>
            <input 
              id="register-password"
              type="password"
              className="agri-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            Create {selectedRole === 'FARMER' ? 'Farmer' : 'Buyer'} Account
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-soil-600)' }}>
          Already registered on AgriHub+?{' '}
          <button 
            type="button"
            onClick={() => navigateTo('login')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-harvest-700)', 
              fontWeight: 700, 
              cursor: 'pointer', 
              textDecoration: 'underline',
              padding: '0.25rem 0.5rem',
            }}
          >
            Login Here
          </button>
        </div>
      </div>
    </div>
  );
};
