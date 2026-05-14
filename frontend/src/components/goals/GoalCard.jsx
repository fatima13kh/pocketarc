import React from 'react';

const CATEGORY_LABELS = {
  EMERGENCY: 'Emergency', 
  EDUCATION: 'Education', 
  TRAVEL: 'Travel', 
  ELECTRONICS: 'Electronics',
  HOME: 'Home', 
  TRANSPORTATION: 'Transportation', 
  HEALTH: 'Health', 
  ENTERTAINMENT: 'Entertainment',
  INVESTMENT: 'Investment', 
  OTHER: 'Other'
};

export default function GoalCard({ goal, onClick }) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const categoryLabel = CATEGORY_LABELS[goal.category] || goal.category;

  return (
    <div className="goal-item" onClick={() => onClick(goal)}>
      <div className="goal-item-header">
        <h3>{goal.name}</h3>
        <span className="goal-category">{categoryLabel}</span>
      </div>
      <div className="goal-amounts">
        <span className="current">{goal.currentAmount.toLocaleString()} BHD</span>
        <span className="separator">/</span>
        <span className="target">{goal.targetAmount.toLocaleString()} BHD</span>
      </div>
      <div className="goal-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <span className="progress-text">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}