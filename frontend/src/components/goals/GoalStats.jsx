import React from 'react';

export default function GoalStats({ cashBalance, totalSaved, totalTarget }) {
  return (
    <div className="stats-cards">
      <div className="stat-card">
        <span className="stat-label">Total Net Worth</span>
        <span className="stat-value">{cashBalance.toLocaleString()} BHD</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Saved</span>
        <span className="stat-value">{totalSaved.toLocaleString()} BHD</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Saving Goals</span>
        <span className="stat-value">{totalTarget.toLocaleString()} BHD</span>
      </div>
    </div>
  );
}