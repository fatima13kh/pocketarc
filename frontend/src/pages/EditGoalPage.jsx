import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { validateGoalForm } from '../validation/goalValidation';
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

export default function EditGoalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateGoal, loadGoals } = useGoals();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    category: '',
  });

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/goals/${id}`);
      const goal = res.data;
      setForm({
        name: goal.name,
        targetAmount: goal.targetAmount,
        category: goal.category,
      });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateGoalForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setApiError('');
    
    try {
      // Send the update directly
      await axiosClient.put(`/goals/${id}`, {
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        category: form.category
      });
      
      // Refresh goals in context
      await loadGoals();
      
      // Navigate back to goals list (not landing page)
      navigate('/goals');
    } catch (err) {
      console.error('Update goal error:', err);
      setApiError(err.response?.data?.error || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Edit Goal" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Edit Goal" />

      <div className="create-goal-page">
        <button className="back-button" onClick={() => navigate(`/goals/${id}`)}>
          ← Back
        </button>

        <div className="create-goal-card">
          <h1>Edit Goal</h1>

          <form onSubmit={handleSubmit}>
            <Input
              label="Goal Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              required
              showClear
            />

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
              value={form.targetAmount}
              onChange={handleChange}
              error={errors.targetAmount}
              required
              showClear
            />

            {apiError && <Alert message={apiError} />}

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate(`/goals/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}