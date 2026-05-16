import { useState } from 'react';
import Button from '../common/Button';

export default function HoldingCard({ holding, onSell, selling }) {
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellShares, setSellShares] = useState('');
  const [error, setError] = useState('');

  const isPositive = holding.profitLossPercent >= 0;

  const handleSell = () => {
    const sharesNum = parseFloat(sellShares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }
    if (sharesNum > holding.shares) {
      setError(`Cannot sell more than ${holding.shares.toLocaleString()} shares`);
      return;
    }
    onSell(holding.transactionId, sharesNum);
    setShowSellModal(false);
    setSellShares('');
    setError('');
  };

  return (
    <>
      <div className="holding-card">
        <div className="holding-header">
          <div>
            <h3 className="holding-symbol">{holding.symbol}</h3>
            <span className="holding-name">{holding.companyName}</span>
          </div>
          <div className={`profit-badge ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
          </div>
        </div>
        
        <div className="holding-stats">
          <div className="stat">
            <span className="stat-label">Shares</span>
            <span className="stat-value">{holding.shares.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg Cost</span>
            <span className="stat-value">{holding.purchasePriceBhd.toLocaleString()} BHD</span>
          </div>
          <div className="stat">
            <span className="stat-label">Current Price</span>
            <span className="stat-value">{holding.currentPriceBhd.toLocaleString()} BHD</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Cost</span>
            <span className="stat-value">{holding.totalCostBhd.toLocaleString()} BHD</span>
          </div>
          <div className="stat">
            <span className="stat-label">Current Value</span>
            <span className="stat-value">{holding.currentValueBhd.toLocaleString()} BHD</span>
          </div>
          <div className={`stat profit-loss ${isPositive ? 'positive' : 'negative'}`}>
            <span className="stat-label">Profit/Loss</span>
            <span className="stat-value">
              {isPositive ? '+' : ''}{holding.profitLossBhd.toLocaleString()} BHD
            </span>
          </div>
        </div>
        
        <div className="holding-actions">
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => setShowSellModal(true)}
            disabled={selling}
          >
            {selling ? 'Processing...' : 'Sell'}
          </Button>
        </div>
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sell {holding.symbol}</h2>
              <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Shares owned: {holding.shares.toLocaleString()}</label>
                <label>Current price: {holding.currentPriceBhd.toLocaleString()} BHD</label>
                <input
                  type="number"
                  placeholder="Enter shares to sell"
                  value={sellShares}
                  onChange={(e) => setSellShares(e.target.value)}
                  step="0.0001"
                  min="0.0001"
                  max={holding.shares}
                  autoFocus
                />
                {sellShares && (
                  <div className="sell-preview">
                    You will receive: {(parseFloat(sellShares) * holding.currentPriceBhd).toLocaleString()} BHD
                  </div>
                )}
              </div>
              {error && <div className="alert alert-error">{error}</div>}
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowSellModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleSell} disabled={selling}>
                Confirm Sell
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}