import React from 'react';

export const MarketFooter: React.FC = () => {
  return (
    <footer className="agri-footer">
      <div className="agri-footer-inner">
        <div className="agri-footer-grid">
          <div className="agri-footer-col">
            <h4>🌱 AgriHub+ Marketplace</h4>
            <p>
              Direct digital trading bridge connecting Indian farmers with verified wholesale and retail produce buyers. 
              Designed specifically for transparent agricultural commerce, fair pricing, and clear deal tracking.
            </p>
          </div>

          <div className="agri-footer-col">
            <h4>🛡️ Farmer Privacy Guarantee</h4>
            <p>
              Exact farm addresses, door numbers, or private GPS coordinates are strictly protected and never publicly displayed. 
              Only general village and district locations appear on produce listings.
            </p>
          </div>

          <div className="agri-footer-col">
            <h4>🌾 Grounded Architecture</h4>
            <p>
              Built strictly without simulated payments, fake market prices, or artificial delivery events. 
              Advisory AI benchmarks are clearly marked as non-binding estimates.
            </p>
          </div>
        </div>

        <div className="agri-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} AgriHub+ — Farmer Trading Marketplace (MVP Version 1.0). All rights reserved.
          </div>
          <div>
            Built with approved React + TypeScript Design System • WCAG AAA Outdoor Contrast
          </div>
        </div>
      </div>
    </footer>
  );
};
