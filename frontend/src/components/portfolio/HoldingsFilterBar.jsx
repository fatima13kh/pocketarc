// src/components/portfolio/HoldingsFilterBar.jsx

// Sort options for Name
const NAME_SORT = [
  { value: '', label: 'Sort By Name' },
  { value: 'name_asc', label: 'A to Z' },
  { value: 'name_desc', label: 'Z to A' },
];

// Sort options for Value
const VALUE_SORT = [
  { value: '', label: 'Sort By Value' },
  { value: 'value_asc', label: 'Low to High' },
  { value: 'value_desc', label: 'High to Low' },
];

// Sort options for Change (P&L)
const CHANGE_SORT = [
  { value: '', label: 'Sort By Change' },
  { value: 'pl_asc', label: 'Low to High' },
  { value: 'pl_desc', label: 'High to Low' },
];

// Sort options for Shares
const SHARES_SORT = [
  { value: '', label: 'Sort By Shares' },
  { value: 'shares_asc', label: 'Low to High' },
  { value: 'shares_desc', label: 'High to Low' },
];

// Categories for filter dropdown
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Consumer Cyclical', label: 'Consumer Cyclical' },
  { value: 'Communication Services', label: 'Communication Services' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'Consumer Defensive', label: 'Consumer Defensive' },
  { value: 'Industrials', label: 'Industrials' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Energy', label: 'Energy' },
];

export default function HoldingsFilterBar({ 
  searchTerm, 
  onSearchChange, 
  categoryFilter,
  onCategoryChange,
  nameSort,
  onNameSortChange,
  valueSort,
  onValueSortChange,
  changeSort,
  onChangeSortChange,
  sharesSort,
  onSharesSortChange,
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
            placeholder="Search by symbol or company name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Filter row - Category dropdown */}
      <div className="stories-toolbar-row">
        <select
          className="stories-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={loading}
        >
          {CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort row */}
      <div className="stories-sort-row">
        <div className="sort-group">
          <label className="sort-label">Name:</label>
          <select
            className="stories-select stories-select-sm"
            value={nameSort}
            onChange={(e) => onNameSortChange(e.target.value)}
            disabled={loading}
          >
            {NAME_SORT.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label className="sort-label">Value:</label>
          <select
            className="stories-select stories-select-sm"
            value={valueSort}
            onChange={(e) => onValueSortChange(e.target.value)}
            disabled={loading}
          >
            {VALUE_SORT.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label className="sort-label">Change:</label>
          <select
            className="stories-select stories-select-sm"
            value={changeSort}
            onChange={(e) => onChangeSortChange(e.target.value)}
            disabled={loading}
          >
            {CHANGE_SORT.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label className="sort-label">Shares:</label>
          <select
            className="stories-select stories-select-sm"
            value={sharesSort}
            onChange={(e) => onSharesSortChange(e.target.value)}
            disabled={loading}
          >
            {SHARES_SORT.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}