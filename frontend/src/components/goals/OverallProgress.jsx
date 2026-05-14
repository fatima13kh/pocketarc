import React from 'react';

export default function OverallProgress({ progress }) {
  return (
    <div className="overall-progress-section">
      <div className="progress-label">Overall Progress</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className="progress-percentage">{Math.round(progress)}%</div>
    </div>
  );
}