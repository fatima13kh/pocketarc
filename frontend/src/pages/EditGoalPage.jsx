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

export default function EditGoalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    category: '',
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

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
      setCurrentImageUrl(goal.coverImageUrl || '');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview('');
    setRemoveImage(true);
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
      let coverImageBase64 = null;
      
      // If removing image
      if (removeImage) {
        const payload = {
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          category: form.category,
          removeImage: true
        };
        
        await axiosClient.put(`/goals/${id}`, payload);
      } 
      // If adding new image
      else if (coverImage) {
        coverImageBase64 = await convertToBase64(coverImage);
        const payload = {
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          category: form.category,
          coverImageBase64: coverImageBase64
        };
        
        await axiosClient.put(`/goals/${id}`, payload);
      }
      // No image change
      else {
        const payload = {
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          category: form.category
        };
        
        await axiosClient.put(`/goals/${id}`, payload);
      }
      
      navigate(`/goals/${id}`);
    } catch (err) {
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

            <div className="form-group">
              <label className="form-label">Upload Image (Optional)</label>
              <div className="image-upload">
                {currentImageUrl && !removeImage && !coverImagePreview && (
                  <div className="image-preview current-image">
                    <img src={currentImageUrl} alt="Current" />
                    <button type="button" onClick={handleRemoveImage}>
                      Remove Image
                    </button>
                  </div>
                )}
                
                {coverImagePreview && (
                  <div className="image-preview">
                    <img src={coverImagePreview} alt="Preview" />
                    <button type="button" onClick={handleRemoveImage}>
                      Remove
                    </button>
                  </div>
                )}
                
                {!currentImageUrl && !coverImagePreview && (
                  <label className="upload-btn">
                    Choose Image
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
                
                {currentImageUrl && !removeImage && !coverImagePreview && (
                  <label className="upload-btn change-image-btn">
                    Change Image
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
              </div>
            </div>

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