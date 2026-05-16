// src/components/portfolio/HoldingCard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import BuyStockModal from '../investment/BuyStockModal';
import axiosClient from '../../api/axiosClient';

const MINIMUM_SHARES_THRESHOLD = 0.0001;

export default function HoldingCard({ holding, onSell, selling, onBuyComplete }) {
  const navigate = useNavigate();
  const [showSellModal, setShowSellModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [sellShares, setSellShares] = useState('');
  const [error, setError] = useState('');
  const [localSelling, setLocalSelling] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);

  useEffect(() => {
    loadCashBalance();
  }, []);

  const loadCashBalance = async () => {
    try {
      const userRes = await axiosClient.get('/users/me');
      setCashBalance(userRes.data.cashBalance || 0);
    } catch (err) {
      console.error('Failed to load cash balance:', err);
    }
  };

  // Use exact shares - NO rounding
  const exactShares = typeof holding.shares === 'number' ? holding.shares : parseFloat(holding.shares);
  // Display exact value without rounding
  const displayShares = exactShares.toString();
  
  if (exactShares <= MINIMUM_SHARES_THRESHOLD) {
    return null;
  }

  const isPositive = holding.profitLossPercent >= 0;

  const stockForBuy = {
    symbol: holding.symbol,
    name: holding.companyName,
    priceBhd: holding.currentPriceBhd,
    priceUsd: holding.currentPriceUsd,
    changePercent: holding.profitLossPercent,
    changeUsd: holding.profitLossBhd
  };

  const handleCardClick = () => {
    navigate(`/portfolio/stock/${holding.symbol}`);
  };

  const handleSellAll = async () => {
    setLocalSelling(true);
    setError('');
    try {
      // Use exact shares value
      const result = await onSell(holding.transactionId, exactShares);
      if (result && result.success) {
        setShowSellModal(false);
        setSellShares('');
        setError('');
        await loadCashBalance();
      } else if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to sell shares. Please try again.');
    } finally {
      setLocalSelling(false);
    }
  };

  const handleSellPartial = async () => {
    let sharesNum = parseFloat(sellShares);
    
    if (isNaN(sharesNum)) {
      setError('Please enter a valid number of shares');
      return;
    }
    
    if (sharesNum <= 0) {
      setError('Please enter a positive number of shares');
      return;
    }
    
    // Compare with exact shares
    if (sharesNum > exactShares + 0.000001) {
      setError(`Cannot sell more than ${exactShares} shares`);
      return;
    }
    
    setLocalSelling(true);
    setError('');
    
    try {
      const result = await onSell(holding.transactionId, sharesNum);
      if (result && result.success) {
        setShowSellModal(false);
        setSellShares('');
        setError('');
        await loadCashBalance();
      } else if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to sell shares. Please try again.');
    } finally {
      setLocalSelling(false);
    }
  };

  const handleBuy = async (amount) => {
    setBuyLoading(true);
    try {
      const result = await onBuyComplete(holding.symbol, holding.companyName, amount);
      if (result && result.success) {
        setShowBuyModal(false);
        await loadCashBalance();
      }
    } catch (err) {
      setError(err.message || 'Failed to buy shares. Please try again.');
    } finally {
      setBuyLoading(false);
    }
    return true;
  };

  return (
    <>
      <div className="holding-card">
        <div className="holding-card-clickable" onClick={handleCardClick}>
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
              <span className="stat-label">Shares Available</span>
              <span className="stat-value">{displayShares}</span>
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
        </div>
        
        <div className="holding-actions">
          <Button variant="primary" size="sm" onClick={() => setShowBuyModal(true)} disabled={buyLoading}>
            {buyLoading ? 'Processing...' : 'Buy More'}
          </Button>
          <Button variant="danger" size="sm" onClick={handleSellAll} disabled={selling || localSelling}>
            {localSelling ? 'Processing...' : 'Sell All'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowSellModal(true)} disabled={selling}>
            Sell Partial
          </Button>
        </div>
      </div>

      {/* Sell Partial Modal */}
      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sell {holding.symbol} - Partial Shares</h2>
              <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Shares available to sell: <strong>{displayShares}</strong></label>
                <label>Current price: {holding.currentPriceBhd.toLocaleString()} BHD</label>
                <input
                  type="number"
                  placeholder="Enter shares to sell"
                  value={sellShares}
                  onChange={(e) => {
                    setSellShares(e.target.value);
                    setError('');
                  }}
                  step="0.000001"
                  min="0.000001"
                  max={exactShares}
                  autoFocus
                />
                {sellShares && parseFloat(sellShares) > 0 && (
                  <div className="sell-preview">
                    You will receive: {(parseFloat(sellShares) * holding.currentPriceBhd).toLocaleString()} BHD
                  </div>
                )}
              </div>
              {error && <div className="alert alert-error" style={{ marginTop: '12px' }}>{error}</div>}
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => {
                setShowSellModal(false);
                setError('');
                setSellShares('');
              }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleSellPartial} disabled={localSelling}>
                {localSelling ? 'Processing...' : 'Confirm Sell'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Buy More Modal */}
      <BuyStockModal
        stock={stockForBuy}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onBuy={handleBuy}
        loading={buyLoading}
        cashBalance={cashBalance}
      />
    </>
  );
}