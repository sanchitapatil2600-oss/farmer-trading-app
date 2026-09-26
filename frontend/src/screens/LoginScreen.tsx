import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { UserRole } from '../data/types';

export const LoginScreen: React.FC = () => {
  const { login, navigateTo } = useMarket();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('FARMER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your mobile phone number or email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await login(identifier.trim(), selectedRole, password.trim());
    setSubmitting(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="agri-auth-wrap">
      <div className="agri-auth-card">
        <div className="agri-auth-header">
          <span style={{ fontSize: '2.5rem' }} aria-hidden="true">🌱</span>
          <h1 className="agri-auth-title">Login to AgriHub+</h1>
          <p className="agri-auth-subtitle">
            Access your agricultural trading dashboard
          </p>
        </div>

        {/* Phase 2 Real Authentication Notice */}
        <div className="agri-alert agri-alert-privacy" style={{ fontSize: '0.85rem' }}>
          <span>🔒</span>
          <div>
            <strong>Phase 2 Authentication:</strong> Connected to server-side authentication API.
            Session verification and server-side role validation are strictly enforced.
          </div>
        </div>

        {error && (
          <div className="agri-alert agri-alert-error" role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role Chooser */}
          <div className="agri-form-group">
            <label className="agri-label">
              Login Role <span className="agri-label-required">*</span>
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
                <span className="agri-role-card-desc">Sell agricultural produce</span>
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
                <span className="agri-role-card-desc">Procure bulk produce</span>
              </div>
            </div>
          </div>

          {/* Email or Phone Input */}
          <div className="agri-form-group">
            <label htmlFor="login-identifier" className="agri-label">
              Mobile Number or Email <span className="agri-label-required">*</span>
            </label>
            <input 
              id="login-identifier"
              type="text"
              className="agri-input"
              placeholder="e.g. 9823045678 or farmer@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
            <div className="agri-helper-text">
              Enter your registered 10-digit mobile number or email ID.
            </div>
          </div>

          {/* Password Input */}
          <div className="agri-form-group">
            <label htmlFor="login-password" className="agri-label">
              Password <span className="agri-label-required">*</span>
            </label>
            <input 
              id="login-password"
              type="password"
              className="agri-input"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : `Login as ${selectedRole === 'FARMER' ? 'Farmer' : 'Buyer'}`}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-soil-600)' }}>
          Don't have an AgriHub+ account yet?{' '}
          <button 
            type="button"
            onClick={() => navigateTo('register')}
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
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
