// src/components/portfolio/PortfolioStatistics.jsx
import React from 'react';

export default function PortfolioStatistics({ 
  cashBalance,
  holdingsValue,
  totalCost,
  totalProfitLoss,
  totalProfitLossPercent
}) {
  const isProfitPositive = totalProfitLoss >= 0;

  return (
    <div className="portfolio-stats-grid">
      {/* Your Spendable Cash - Main focus */}
      <div className="stat-card stat-card-cash">
        <span className="stat-label">💵 Your Spendable Cash</span>
        <span className="stat-value">{cashBalance.toLocaleString()} BHD</span>
        <span className="stat-subtitle">Money you can use for goals and stories</span>
      </div>
      
      {/* Current Stock Value */}
      <div className="stat-card stat-card-holdings">
        <span className="stat-label">📊 Current Stock Value</span>
        <span className="stat-value">{holdingsValue.toLocaleString()} BHD</span>
        <span className="stat-subtitle">Value of stocks you own</span>
      </div>

      {/* Total Cost - What you paid */}
      <div className="stat-card stat-card-cost">
        <span className="stat-label">💸 Total Cost</span>
        <span className="stat-value">{totalCost.toLocaleString()} BHD</span>
        <span className="stat-subtitle">What you paid for your stocks</span>
      </div>

      {/* Total P&L - Your profit or loss */}
      <div className={`stat-card ${isProfitPositive ? 'stat-card-profit' : 'stat-card-loss'}`}>
        <span className="stat-label">📊 Total P&L</span>
        <span className={`stat-value ${isProfitPositive ? 'positive' : 'negative'}`}>
          {isProfitPositive ? '+' : ''}{totalProfitLoss.toLocaleString()} BHD
        </span>
        <span className="stat-percent">
          ({isProfitPositive ? '+' : ''}{totalProfitLossPercent}%)
        </span>
        <span className="stat-subtitle">
          {isProfitPositive ? 'Profit' : 'Loss'} on your investments
        </span>
      </div>
    </div>
  );
}