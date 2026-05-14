import React, { useState } from 'react';
import Alert from '../common/Alert';

const CATEGORIES = [
  { value: 'CAR', label: 'Car' },
  { value: 'HOUSE', label: 'House' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreateGoalModal({ isOpen, onClose, onCreateGoal }) {
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    category: '',
    coverImage: null,
    coverImagePreview: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Goal name is required');
      return;
    }
    if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }
    if (!form.category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('targetAmount', form.targetAmount);
    formData.append('category', form.category);
    if (form.coverImage) {
      formData.append('coverImage', form.coverImage);
    }

    const success = await onCreateGoal(formData);
    if (success) {
      setForm({ name: '', targetAmount: '', category: '', coverImage: null, coverImagePreview: '' });
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-back" onClick={onClose}>← Back</button>
          <h2>Create Goal</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Goal Name</label>
            <input
              type="text"
              placeholder="e.g., New Car, Trip to Japan"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>All Progress</label>
            <div className="progress-preview">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }} />
              </div>
              <span>0%</span>
            </div>
          </div>

          <div className="form-group">
            <label>Choose a category</label>
            <select
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Choose a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Target Amount (BHD)</label>
            <input
              type="number"
              placeholder="0.00"
              value={form.targetAmount}
              onChange={(e) => setForm(prev => ({ ...prev, targetAmount: e.target.value }))}
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Upload Image (Optional)</label>
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

          {error && <Alert message={error} />}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}