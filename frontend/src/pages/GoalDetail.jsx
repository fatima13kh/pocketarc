import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { validateAddFunds } from '../validation/goalValidation';
import { useGoals } from '../context/GoalsContext';

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

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cashBalance, loadGoals } = useGoals();
  
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/goals/${id}`);
      setGoal(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load goal:', err);
      setError(err.response?.data?.error || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const refreshGoal = async () => {
    setRefreshing(true);
    try {
      const res = await axiosClient.get(`/goals/${id}`);
      setGoal(res.data);
      await loadGoals();
    } catch (err) {
      console.error('Failed to refresh goal:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > cashBalance) {
      setError(`Insufficient balance. You have ${cashBalance.toLocaleString()} BHD`);
      return;
    }

    setAddingFunds(true);
    setError('');
    try {
      await axiosClient.post(`/goals/${id}/add-funds`, null, {
        params: { amount }
      });
      
      await refreshGoal();
      setShowAddFundsModal(false);
      setAddFundsAmount('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add funds');
    } finally {
      setAddingFunds(false);
    }
  };

  const handleEditGoal = () => {
    navigate(`/goals/${id}/edit`);
  };

  const handleDeleteGoal = async () => {
    if (window.confirm('Are you sure you want to delete this goal? The money will be returned to your cash balance.')) {
      try {
        await axiosClient.delete(`/goals/${id}`);
        await loadGoals();
        navigate('/goals');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete goal');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Goal Details" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !goal) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Goal Details" />
        <div className="goals-detail-page">
          <button className="back-button" onClick={() => navigate('/goals')}>
            ← Back to Goals
          </button>
          <div className="alert alert-error" style={{ textAlign: 'center', padding: '60px' }}>
            {error}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!goal) return null;

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const categoryLabel = CATEGORY_LABELS[goal.category] || goal.category;

  return (
    <>
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title={goal.name} />
        
        <div className="goals-detail-page">
          <button className="back-button" onClick={() => navigate('/goals')}>
            ← Back to Goals
          </button>

          {refreshing && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Spinner dark />
            </div>
          )}

          <div className="goal-detail-card">
            <div className="goal-detail-header">
              <div className="goal-detail-image">
                {goal.coverImageUrl ? (
                  <img src={goal.coverImageUrl} alt={goal.name} />
                ) : (
                  <div className="goal-detail-image-placeholder">🎯</div>
                )}
              </div>
              <div className="goal-detail-info">
                <h1>{goal.name}</h1>
                <span className="goal-detail-category">{categoryLabel}</span>
              </div>
            </div>

            <div className="goal-detail-stats">
              <div className="stat-item">
                <span className="stat-label">Current Amount</span>
                <span className="stat-value">{goal.currentAmount.toLocaleString()} BHD</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Target Amount</span>
                <span className="stat-value">{goal.targetAmount.toLocaleString()} BHD</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining</span>
                <span className="stat-value">{remaining.toLocaleString()} BHD</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Progress</span>
                <span className="stat-value">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="goal-detail-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>

            <div className="goal-detail-actions">
              <Button variant="primary" onClick={() => setShowAddFundsModal(true)}>
                Add Funds
              </Button>
              <Button variant="secondary" onClick={handleEditGoal}>
                Edit Goal
              </Button>
              <Button variant="danger" onClick={handleDeleteGoal}>
                Delete Goal
              </Button>
            </div>

            <div className="goal-detail-created">
              Created: {new Date(goal.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Funds to "{goal.name}"</h2>
              <button className="modal-close" onClick={() => setShowAddFundsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Current Amount: {goal.currentAmount.toLocaleString()} BHD</label>
              </div>
              <div className="form-group">
                <label>Target Amount: {goal.targetAmount.toLocaleString()} BHD</label>
              </div>
              <div className="form-group">
                <label>Remaining: {remaining.toLocaleString()} BHD</label>
              </div>
              <div className="form-group">
                <label>Available Net Worth: {cashBalance.toLocaleString()} BHD</label>
                <input
                  type="number"
                  placeholder="Enter amount to add"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  step="1"
                  min="1"
                  autoFocus
                />
              </div>
              {error && <Alert message={error} />}
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowAddFundsModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddFunds} loading={addingFunds}>
                Add Funds
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}