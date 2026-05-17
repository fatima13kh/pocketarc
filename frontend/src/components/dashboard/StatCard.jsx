// src/components/dashboard/StatCard.jsx
import React from 'react';

export default function StatCard({ title, value, change, icon, color = 'primary' }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  // Format value to show with proper decimal places for shares
  const formattedValue = typeof value === 'number' || typeof value === 'string' 
    ? value 
    : value?.toFixed(4);

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        <span className="stat-card-title">{title}</span>
      </div>
      <div className="stat-card-value">{formattedValue?.toLocaleString() || 0}</div>
      {change !== undefined && change !== null && (
        <div className={`stat-card-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {isPositive && '↑'} {isNegative && '↓'} {Math.abs(change).toLocaleString()}
        </div>
      )}
    </div>
  );
}