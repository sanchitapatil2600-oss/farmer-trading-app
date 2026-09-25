import React from 'react';
import { useMarket } from '../../context/MarketContext';

interface MarketHeaderProps {
  backendHealth?: {
    status: string;
    environment: string;
  } | null;
  backendLoading?: boolean;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({ 
  backendHealth, 
  backendLoading = false 
}) => {
  const { activeScreen, navigateTo, currentUser, logout } = useMarket();

  return (
    <header className="agri-header">
      <div className="agri-header-inner">
        {/* Brand Identity */}
        <div 
          className="agri-brand"
          onClick={() => navigateTo('landing')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigateTo('landing'); }}
        >
          <div className="agri-brand-icon" aria-hidden="true">🌱</div>
          <div>
            <div className="agri-brand-name">
              AgriHub<span>+</span>
            </div>
            <div className="agri-brand-subtitle">
              Farmer Trading Marketplace • Direct Agricultural Trade
            </div>
          </div>
        </div>

        {/* Navigation & Controls */}
        <nav className="agri-header-nav" aria-label="Main Navigation">
          {/* Phase 1 Backend Health Indicator */}
          <div 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.25rem' }}
            title="Preserved Phase 1 Backend Connection Check"
          >
            <span 
              className={`status-pill ${backendHealth?.status === 'operational' ? 'pill-active' : 'pill-pending'}`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            >
              {backendLoading ? 'Checking API...' : backendHealth?.status === 'operational' ? '● Backend Online' : '○ Standalone Mode'}
            </span>
          </div>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'landing' ? 'active' : ''}`}
            onClick={() => navigateTo('landing')}
          >
            Home
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'farmer_dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('farmer_dashboard')}
          >
            Dashboard
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'marketplace' || activeScreen === 'produce_details' ? 'active' : ''}`}
            onClick={() => navigateTo('marketplace')}
          >
            Marketplace
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'my_listings' ? 'active' : ''}`}
            onClick={() => navigateTo('my_listings')}
          >
            My Listings
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'offers' ? 'active' : ''}`}
            onClick={() => navigateTo('offers')}
          >
            Offers
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'deal_tracker' ? 'active' : ''}`}
            onClick={() => navigateTo('deal_tracker')}
          >
            Deal Tracker
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'ai_price' ? 'active' : ''}`}
            onClick={() => navigateTo('ai_price')}
          >
            AI Advisory
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'payment_status' ? 'active' : ''}`}
            onClick={() => navigateTo('payment_status')}
          >
            Payment Status
          </button>

          <button 
            type="button"
            className={`agri-nav-btn ${activeScreen === 'delivery_status' ? 'active' : ''}`}
            onClick={() => navigateTo('delivery_status')}
          >
            Delivery Status
          </button>

          {!currentUser ? (
            <>
              <button 
                type="button"
                className={`agri-nav-btn ${activeScreen === 'login' ? 'active' : ''}`}
                onClick={() => navigateTo('login')}
              >
                Login
              </button>

              <button 
                type="button"
                className={`agri-nav-btn agri-nav-btn-primary ${activeScreen === 'register' ? 'active' : ''}`}
                onClick={() => navigateTo('register')}
              >
                Register
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="agri-user-pill">
                <span>{currentUser.role === 'FARMER' ? '🌾' : '🏪'}</span>
                <span>
                  <strong>{currentUser.name}</strong> ({currentUser.role === 'FARMER' ? 'Farmer' : 'Buyer'})
                </span>
              </span>

              <button 
                type="button"
                className="agri-nav-btn"
                onClick={logout}
                style={{ fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
