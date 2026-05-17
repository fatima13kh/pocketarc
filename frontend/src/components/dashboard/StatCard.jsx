// src/components/dashboard/StatCard.jsx
import React from 'react';

export default function StatCard({ title, value, change, icon, color = 'primary', subtitle, hint }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  // Format value to show with proper decimal places for shares
  const formattedValue = typeof value === 'number' || typeof value === 'string' 
    ? value 
    : value?.toFixed(4);

  // Check if title contains BHD to add suffix
  const showBhdSuffix = title?.includes('BHD') && !title?.includes('Shares');

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        <span className="stat-card-title">{title}</span>
      </div>
      <div className="stat-card-value">
        {formattedValue?.toLocaleString() || 0}
        {showBhdSuffix && <span className="stat-card-suffix"> BHD</span>}
      </div>
      {change !== undefined && change !== null && change !== 0 && (
        <div className={`stat-card-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {isPositive && '↑'} {isNegative && '↓'} {Math.abs(change).toLocaleString()}
          {showBhdSuffix && ' BHD'}
        </div>
      )}
      {subtitle && (
        <div className="stat-subtitle" style={{ fontSize: '10px', marginTop: '8px', color: 'var(--muted)' }}>
          {subtitle}
        </div>
      )}
      {hint && (
        <div className="stat-hint" style={{ fontSize: '9px', marginTop: '4px', color: 'var(--muted)', fontStyle: 'italic' }}>
          {hint}
        </div>
      )}
    </div>
  );
}