export default function PortfolioSummary({ portfolio }) {
  const isPositive = portfolio.totalProfitLossPercent >= 0;

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <span className="stat-label">Total Value</span>
        <span className="stat-value">{portfolio.totalValueBhd.toLocaleString()} BHD</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Cost</span>
        <span className="stat-value">{portfolio.totalCostBhd.toLocaleString()} BHD</span>
      </div>
      <div className={`stat-card ${isPositive ? 'text-success' : 'text-error'}`}>
        <span className="stat-label">Total P/L</span>
        <span className="stat-value">
          {isPositive ? '+' : ''}{portfolio.totalProfitLossBhd.toLocaleString()} BHD
          ({isPositive ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}