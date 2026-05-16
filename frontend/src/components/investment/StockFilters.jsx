const SECTORS = [
  { value: '', label: 'All Sectors' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Communication Services', label: 'Communication Services' },
  { value: 'Consumer Cyclical', label: 'Consumer Cyclical' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Consumer Defensive', label: 'Consumer Defensive' },
  { value: 'Industrials', label: 'Industrials' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Sort By' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'change_asc', label: 'Change: Low to High' },
  { value: 'change_desc', label: 'Change: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

export default function StockFilters({ 
  searchTerm, 
  onSearchChange, 
  sectorFilter, 
  onSectorChange,
  sortBy,
  onSortChange,
  loading
}) {
  return (
    <div className="stories-toolbar">
      <div className="stories-toolbar-top">
        <div className="stories-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search stocks by symbol or company name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="stories-toolbar-row">
        <select
          className="stories-select"
          value={sectorFilter}
          onChange={(e) => onSectorChange(e.target.value)}
          disabled={loading}
        >
          {SECTORS.map(sector => (
            <option key={sector.value} value={sector.value}>
              {sector.label}
            </option>
          ))}
        </select>

        <select
          className="stories-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          disabled={loading}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}