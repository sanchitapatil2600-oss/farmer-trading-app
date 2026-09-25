import React, { useState, useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { ProduceCard } from '../components/marketplace/ProduceCard';
import { ProduceFilterBar } from '../components/marketplace/ProduceFilterBar';

export const BuyerMarketplaceScreen: React.FC = () => {
  const { listings, navigateTo } = useMarket();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Extract unique categories and districts dynamically
  const categories = useMemo(() => {
    return Array.from(new Set(listings.map(l => l.category)));
  }, [listings]);

  const districts = useMemo(() => {
    return Array.from(new Set(listings.map(l => l.district)));
  }, [listings]);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.productName.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesDistrict = item.district.toLowerCase().includes(q);
        const matchesVillage = item.village.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDistrict && !matchesVillage) {
          return false;
        }
      }

      // Category match
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // District match
      if (selectedDistrict !== 'ALL' && item.district !== selectedDistrict) {
        return false;
      }

      // Status match (ACTIVE vs SOLD_OUT only)
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [listings, searchQuery, selectedCategory, selectedDistrict, selectedStatus]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedDistrict('ALL');
    setSelectedStatus('ALL');
  };

  const handleSelectListing = (listingId: string) => {
    navigateTo('produce_details', { listingId });
  };

  return (
    <div>
      {/* Marketplace Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="agri-section-title" style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
              <span>🏪</span> Buyer Produce Marketplace
            </h1>
            <p className="agri-section-subtitle" style={{ marginBottom: 0 }}>
              Discover available agricultural crops directly from farmers. Filter by mandi district, category, or crop type.
            </p>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--color-soil-600)' }}>
            Showing <strong>{filteredListings.length}</strong> of {listings.length} produce batches
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ProduceFilterBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleReset}
        districts={districts}
        categories={categories}
      />

      {/* Produce Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="market-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--color-canvas-bg)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🌾</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-soil-900)', marginBottom: '0.5rem' }}>
            No produce batches found matching your search
          </h3>
          <p style={{ color: 'var(--color-soil-600)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Try adjusting your search keywords, clearing district filters, or viewing all categories.
          </p>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleReset}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="agri-produce-grid">
          {filteredListings.map((listing) => (
            <ProduceCard 
              key={listing.id}
              listing={listing}
              onSelect={handleSelectListing}
            />
          ))}
        </div>
      )}
    </div>
  );
};
