// src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Alert from '../components/common/Alert';
import { validateRegister } from '../validation/userValidation';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

const INITIAL = {
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear specific field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear API error when user types
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    
    const errs = validateRegister(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: form.username,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
      });
      
      const loginRes = await authApi.login({
        email: form.email,
        password: form.password
      });
      login(loginRes.data.token, {
        username: loginRes.data.username,
        email: loginRes.data.email,
        isAdmin: loginRes.data.isAdmin,
      });
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Register">
      <div className="auth-page">
        <div className="auth-card-new">
          <button className="auth-back-btn-new" onClick={() => navigate('/')}>
            ← Back to Home
          </button>

          <h2 className="auth-title">Register</h2>

          {apiError && (
            <div className="auth-alert auth-alert-error">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="auth-form-group">
              <label className="auth-label">Username</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  name="username"
                  className={`auth-input ${errors.username ? 'error' : ''}`}
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
                {form.username && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => setForm(prev => ({ ...prev, username: '' }))}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {errors.username && <span className="auth-error">{errors.username}</span>}
            </div>

            {/* Email */}
            <div className="auth-form-group">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  name="email"
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {form.email && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => setForm(prev => ({ ...prev, email: '' }))}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </div>

            {/* Phone Number */}
            <div className="auth-form-group">
              <label className="auth-label">Phone Number</label>
              <div className="auth-input-wrapper">
                <input
                  type="tel"
                  name="phoneNumber"
                  className={`auth-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="8 digits (e.g., 39994093)"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  autoComplete="tel"
                />
                {form.phoneNumber && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => setForm(prev => ({ ...prev, phoneNumber: '' }))}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {errors.phoneNumber && <span className="auth-error">{errors.phoneNumber}</span>}
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {form.password && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => setForm(prev => ({ ...prev, password: '' }))}
                  >
                    <FaTimes />
                  </button>
                )}
                <button 
                  type="button" 
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="auth-error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {form.confirmPassword && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => setForm(prev => ({ ...prev, confirmPassword: '' }))}
                  >
                    <FaTimes />
                  </button>
                )}
                <button 
                  type="button" 
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Register'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}