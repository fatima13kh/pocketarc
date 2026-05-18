// src/components/goals/GoalFilters.jsx
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

// Sort options for Date
const DATE_SORT_OPTIONS = [
  { value: '', label: 'Sort By Date' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

// Sort options for Progress
const PROGRESS_SORT_OPTIONS = [
  { value: '', label: 'Sort By Progress' },
  { value: 'progress_asc', label: 'Low to High' },
  { value: 'progress_desc', label: 'High to Low' },
];

// Sort options for Target
const TARGET_SORT_OPTIONS = [
  { value: '', label: 'Sort By Target' },
  { value: 'target_asc', label: 'Low to High' },
  { value: 'target_desc', label: 'High to Low' },
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
    <div className="stories-toolbar">
      {/* Search Bar */}
      <div className="stories-toolbar-top">
        <div className="stories-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filter row - Category dropdown */}
      <div className="stories-toolbar-row">
        <select
          className="stories-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Sort row */}
      <div className="stories-sort-row">
        <div className="sort-group">
          <label className="sort-label">Date:</label>
          <select
            className="stories-select stories-select-sm"
            value={dateSort}
            onChange={(e) => onDateSortChange(e.target.value)}
          >
            {DATE_SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label className="sort-label">Progress:</label>
          <select
            className="stories-select stories-select-sm"
            value={progressSort}
            onChange={(e) => onProgressSortChange(e.target.value)}
          >
            {PROGRESS_SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label className="sort-label">Target:</label>
          <select
            className="stories-select stories-select-sm"
            value={targetSort}
            onChange={(e) => onTargetSortChange(e.target.value)}
          >
            {TARGET_SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}