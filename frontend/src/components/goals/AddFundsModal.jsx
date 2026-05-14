import React, { useState } from 'react';
import Alert from '../common/Alert';

export default function AddFundsModal({ isOpen, onClose, goal, cashBalance, onAddFunds }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > cashBalance) {
      setError(`Insufficient balance. You have ${cashBalance.toLocaleString()} BHD`);
      return;
    }

    setLoading(true);
    setError('');
    const success = await onAddFunds(goal.id, numAmount);
    if (success) {
      setAmount('');
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-back" onClick={onClose}>← Back</button>
          <h2>Add Funds</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Goal Name</label>
            <input type="text" value={goal.name} disabled />
          </div>

          <div className="form-group">
            <label>Available Net Worth: {cashBalance.toLocaleString()} BHD</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="1"
              min="1"
              autoFocus
            />
          </div>

          {error && <Alert message={error} />}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}