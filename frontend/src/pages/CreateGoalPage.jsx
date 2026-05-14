import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import { validateGoalForm, validateAddFunds } from '../validation/goalValidation';
import { useGoals } from '../context/GoalsContext';

const CATEGORIES = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'HOME', label: 'Home' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'OTHER', label: 'Other' },
];

// Helper function to convert file to Base64
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default function CreateGoalPage() {
  const navigate = useNavigate();
  const { addFunds, cashBalance } = useGoals();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);
  const [createdGoalId, setCreatedGoalId] = useState(null);
  const [createdGoalName, setCreatedGoalName] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    category: '',
    coverImage: null,
    coverImagePreview: ''
  });

  useEffect(() => {
    loadCashBalance();
  }, []);

  const loadCashBalance = async () => {
    try {
      const res = await axiosClient.get('/users/me');
      console.log('Cash balance:', res.data.cashBalance);
    } catch (err) {
      console.error('Failed to load cash balance');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        coverImage: file,
        coverImagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    
    console.log('=== STARTING CREATE GOAL ===');
    
    const validationErrors = validateGoalForm(form);
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validation errors:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    
    try {
      let coverImageBase64 = null;
      if (form.coverImage) {
        console.log('Converting image to Base64...');
        coverImageBase64 = await convertToBase64(form.coverImage);
        console.log('Image converted, length:', coverImageBase64.length);
      }
      
      const payload = {
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        category: form.category,
        coverImageBase64: coverImageBase64
      };
      
      // LOG THE PAYLOAD
      console.log('=== SENDING PAYLOAD ===');
      console.log('URL:', '/api/goals');
      console.log('Name:', payload.name);
      console.log('Target Amount:', payload.targetAmount);
      console.log('Category:', payload.category);
      console.log('Has Image:', !!payload.coverImageBase64);
      console.log('Image length:', payload.coverImageBase64 ? payload.coverImageBase64.length : 0);
      
      const response = await axiosClient.post('/goals', payload);
      
      console.log('=== RESPONSE SUCCESS ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      
      setCreatedGoalId(response.data.id);
      setCreatedGoalName(response.data.name);
      setShowAddFundsModal(true);
    } catch (err) {
      console.error('=== ERROR RESPONSE ===');
      console.error('Status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      setApiError(err.response?.data?.error || err.response?.data?.message || 'Failed to create goal');
    } finally {
      setLoading(false);
      console.log('=== CREATE GOAL FINISHED ===');
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      setApiError('Please enter a valid amount');
      return;
    }
    if (amount > cashBalance) {
      setApiError(`Insufficient balance. You have ${cashBalance.toLocaleString()} BHD`);
      return;
    }

    setAddingFunds(true);
    setApiError('');
    
    try {
      await axiosClient.post(`/goals/${createdGoalId}/add-funds`, null, {
        params: { amount }
      });
      setShowAddFundsModal(false);
      navigate('/goals');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to add funds');
    } finally {
      setAddingFunds(false);
    }
  };

  const handleSkipAddFunds = () => {
    navigate('/goals');
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Create Goal" />

      <div className="create-goal-page">
        <button className="back-button" onClick={() => navigate('/goals')}>
          ← Back
        </button>

        <div className="create-goal-card">
          <h1>Create Goal</h1>

          <form onSubmit={handleCreateGoal}>
            <Input
              label="Goal Name"
              name="name"
              placeholder="e.g., New Car, Trip to Japan"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              required
              showClear
            />

            <div className="form-group">
              <label className="form-label">All Progress</label>
              <div className="progress-preview">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }} />
                </div>
                <span>0%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Choose a category</label>
              <select
                name="category"
                className={`form-select ${errors.category ? 'error' : ''}`}
                value={form.category}
                onChange={handleChange}
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            <Input
              label="Target Amount (BHD)"
              name="targetAmount"
              type="number"
              placeholder="0.00"
              value={form.targetAmount}
              onChange={handleChange}
              error={errors.targetAmount}
              required
              showClear
            />

            <div className="form-group">
              <label className="form-label">Upload Image (Optional)</label>
              <div className="image-upload">
                {form.coverImagePreview ? (
                  <div className="image-preview">
                    <img src={form.coverImagePreview} alt="Preview" />
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, coverImage: null, coverImagePreview: '' }))}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-btn">
                    Choose Image
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
              </div>
            </div>

            {apiError && <Alert message={apiError} />}

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate('/goals')}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Goal
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Funds to "{createdGoalName}"</h2>
              <button className="modal-close" onClick={() => setShowAddFundsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
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
              {apiError && <Alert message={apiError} />}
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={handleSkipAddFunds}>
                Skip for Now
              </Button>
              <Button variant="primary" onClick={handleAddFunds} loading={addingFunds}>
                Add Funds
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}