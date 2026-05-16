import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';

export default function BuyStockModal({ stock, isOpen, onClose, onBuy, loading, cashBalance }) {
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setLocalError('');
    }
  }, [isOpen]);

  if (!isOpen || !stock) return null;

  const pricePerShare = stock.priceBhd;
  const shares = amount && parseFloat(amount) > 0 ? (parseFloat(amount) / pricePerShare).toFixed(4) : null;

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    setLocalError('');
  };

  const handleBuy = () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || amount === '') {
      setLocalError('Please enter an amount');
      return;
    }
    if (isNaN(amountNum)) {
      setLocalError('Please enter a valid number');
      return;
    }
    if (amountNum <= 0) {
      setLocalError('Amount must be greater than 0 BHD');
      return;
    }
    if (amountNum > cashBalance) {
      setLocalError(`Insufficient balance. Your net worth is ${cashBalance.toLocaleString()} BHD`);
      return;
    }
    
    setLocalError('');
    onBuy(amountNum);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content buy-stock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Buy {stock.name} ({stock.symbol})</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Price per share - Green box on top */}
          <div className="price-preview">
            <span className="price-label">Price per share</span>
            <span className="price-amount">{pricePerShare?.toLocaleString() || 0} BHD</span>
            <span className="price-usd">${stock.priceUsd?.toLocaleString() || 0} USD</span>
          </div>

          {/* Net Worth Display */}
          <div className="balance-info">
            <span className="balance-label">Your Net Worth</span>
            <span className="balance-amount">{cashBalance?.toLocaleString() || 0} BHD</span>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label>Amount to Invest (BHD)</label>
            <input
              type="number"
              placeholder="Enter amount in BHD"
              value={amount}
              onChange={handleAmountChange}
              step="1"
              min="1"
              autoFocus
            />
          </div>

          {/* Shares Preview - shows when amount is entered */}
          {shares && (
            <div className="shares-preview">
              You will receive approximately <strong>{shares}</strong> shares
            </div>
          )}

          {localError && <Alert message={localError} />}
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleBuy} loading={loading}>
            Buy Stock
          </Button>
        </div>
      </div>
    </div>
  );
}