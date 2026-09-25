import React from 'react';

interface ProduceFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  districts: string[];
  categories: string[];
}

export const ProduceFilterBar: React.FC<ProduceFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDistrict,
  onDistrictChange,
  selectedStatus,
  onStatusChange,
  onReset,
  districts,
  categories,
}) => {
  return (
    <div className="market-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
        {/* Search Input */}
        <div style={{ flex: 2, minWidth: '240px' }}>
          <label htmlFor="produce-search" className="agri-label">
            Search Produce
          </label>
          <input 
            id="produce-search"
            type="text"
            className="agri-input"
            placeholder="Search crops (e.g. Wheat, Onion, Soybean)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category-filter" className="agri-label">
            Crop Category
          </label>
          <select 
            id="category-filter"
            className="agri-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div>
          <label htmlFor="district-filter" className="agri-label">
            Mandi District
          </label>
          <select 
            id="district-filter"
            className="agri-select"
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
          >
            <option value="ALL">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="agri-label">
            Listing Status
          </label>
          <select 
            id="status-filter"
            className="agri-select"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="ALL">All Batches</option>
            <option value="ACTIVE">Active (Available)</option>
            <option value="SOLD_OUT">Sold Out (Archived)</option>
          </select>
        </div>

        {/* Reset Button */}
        <div>
          <button 
            type="button"
            className="btn-secondary"
            style={{ width: '100%', height: '48px' }}
            onClick={onReset}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
