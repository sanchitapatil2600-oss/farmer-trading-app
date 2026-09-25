import React, { useEffect, useState } from 'react';
import { MarketProvider, useMarket } from './context/MarketContext';
import { MarketHeader } from './components/layout/MarketHeader';
import { MarketFooter } from './components/layout/MarketFooter';
import { LandingScreen } from './screens/LandingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { FarmerDashboardScreen } from './screens/FarmerDashboardScreen';
import { BuyerMarketplaceScreen } from './screens/BuyerMarketplaceScreen';
import { ProduceDetailsScreen } from './screens/ProduceDetailsScreen';
import { MyListingsScreen } from './screens/MyListingsScreen';
import { OffersScreen } from './screens/OffersScreen';
import { DealTrackerScreen } from './screens/DealTrackerScreen';
import { PaymentStatusScreen } from './screens/PaymentStatusScreen';
import { DeliveryStatusScreen } from './screens/DeliveryStatusScreen';
import { AIPriceScreen } from './screens/AIPriceScreen';
import { AddProduceScreen } from './screens/AddProduceScreen';
import './styles/design-tokens.css';
import './styles/agricultural-theme.css';

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

const ScreenRenderer: React.FC = () => {
  const { activeScreen, currentUser, navigateTo } = useMarket();

  switch (activeScreen) {
    case 'landing':
      return <LandingScreen />;
    case 'login':
      return <LoginScreen />;
    case 'register':
      return <RegisterScreen />;
    case 'farmer_dashboard':
      return <FarmerDashboardScreen />;
    case 'marketplace':
      return <BuyerMarketplaceScreen />;
    case 'produce_details':
      return <ProduceDetailsScreen />;
    case 'add_produce':
      return <AddProduceScreen />;
    case 'my_listings':
      return <MyListingsScreen />;
    case 'offers':
      return <OffersScreen />;
    case 'deal_tracker':
      return <DealTrackerScreen />;
    case 'payment_status':
      return <PaymentStatusScreen />;
    case 'delivery_status':
      return <DeliveryStatusScreen />;
    case 'ai_price':
      return <AIPriceScreen />;
    default:
      // Fallback banner
      return (
        <div className="agri-auth-wrap" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div className="agri-auth-card">
            <span style={{ fontSize: '3rem' }}>🌱</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-forest-900)', margin: '1rem 0 0.5rem 0' }}>
              AgriHub+ Demonstration
            </h2>
            <p style={{ color: 'var(--color-soil-600)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Batches 1, 2, 3, and 4 (Landing, Login, Register, Farmer Dashboard, Marketplace, Produce Details, My Listings, Offers, Deal Tracker, Payment Status, Delivery Status, and AI Advisory) are active.
              {currentUser && (
                <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>
                  Active Demonstration Session: {currentUser.name} ({currentUser.role === 'FARMER' ? 'Farmer' : 'Buyer'})
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => navigateTo('farmer_dashboard')}
              >
                Farmer Dashboard
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigateTo('marketplace')}
              >
                Buyer Marketplace
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigateTo('deal_tracker')}
              >
                Deal Tracker
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigateTo('landing')}
              >
                Landing Screen
              </button>
            </div>
          </div>
        </div>
      );
  }
};

export const AppContent: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Preserve Phase 1 Backend Health foundation check
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
      .catch(() => {
        // Safe standalone frontend fallback
        setLoading(false);
      });
  }, []);

  return (
    <div className="agri-page-wrap">
      <MarketHeader 
        backendHealth={health ? { status: health.status, environment: health.environment } : null}
        backendLoading={loading}
      />

      <main className="agri-content-container">
        <ScreenRenderer />
      </main>

      <MarketFooter />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MarketProvider>
      <AppContent />
    </MarketProvider>
  );
};
