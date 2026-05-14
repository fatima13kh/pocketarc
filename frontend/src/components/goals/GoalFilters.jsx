import React from 'react';
import Input from '../common/Input';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'HOME', label: 'Home' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'OTHER', label: 'Other' },
];

// Date Sort Options
const DATE_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

// Progress Sort Options
const PROGRESS_SORT_OPTIONS = [
  { value: 'progress_asc', label: 'Progress: Low to High' },
  { value: 'progress_desc', label: 'Progress: High to Low' },
];

// Target Sort Options
const TARGET_SORT_OPTIONS = [
  { value: 'target_asc', label: 'Target: Low to High' },
  { value: 'target_desc', label: 'Target: High to Low' },
];

export default function GoalFilters({ 
  searchTerm, 
  onSearchChange, 
  categoryFilter, 
  onCategoryChange,
  dateSort,
  onDateSortChange,
  progressSort,
  onProgressSortChange,
  targetSort,
  onTargetSortChange
}) {
  return (
    <div className="goals-filters-container">
      {/* Search Bar */}
      <div className="goals-search-wrapper">
        <Input
          name="search"
          type="text"
          placeholder="Search goals..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          showClear
        />
      </div>

      {/* Filter Row - Category and Sort Dropdowns */}
      <div className="goals-filter-row">
        {/* Category Filter */}
        <select
          className="goals-filter-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        {/* Date Sort */}
        <select
          className="goals-filter-select"
          value={dateSort}
          onChange={(e) => onDateSortChange(e.target.value)}
        >
          <option value="">Sort By Date</option>
          {DATE_SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Progress Sort */}
        <select
          className="goals-filter-select"
          value={progressSort}
          onChange={(e) => onProgressSortChange(e.target.value)}
        >
          <option value="">Sort By Progress</option>
          {PROGRESS_SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Target Sort */}
        <select
          className="goals-filter-select"
          value={targetSort}
          onChange={(e) => onTargetSortChange(e.target.value)}
        >
          <option value="">Sort By Target</option>
          {TARGET_SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}