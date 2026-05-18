// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import { validateLogin } from '../validation/userValidation';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Set success message from navigation state (only once on mount)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clear the state to prevent it from showing again
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user types in that field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear API error when user types in ANY field
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    
    // Validate form - this sets validation errors
    const errs = validateLogin(form.email, form.password);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    // Clear validation errors since they passed
    setErrors({});
    setLoading(true);
    
    try {
      const res = await authApi.login(form);
      login(res.data.token, {
        username: res.data.username,
        email: res.data.email,
        isAdmin: res.data.isAdmin,
      });
      navigate('/dashboard');
    } catch (err) {
      // IMPORTANT: Do NOT clear apiError. Keep it visible.
      // Do NOT set loading to false immediately? Actually we should.
      const errorMessage = err.response?.data?.error || 'Invalid email or password. Please try again.';
      setApiError(errorMessage);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Clear API error when user clicks on input
  const handleInputClick = () => {
    if (apiError) {
      setApiError('');
    }
  };

  return (
    <Layout title="Log In">
      <div className="auth-page">
        <div className="auth-card-new">
          <button className="auth-back-btn-new" onClick={() => navigate('/')}>
            ← Back to Home
          </button>

          <h2 className="auth-title">Log In</h2>

          {apiError && (
            <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
              {apiError}
            </div>
          )}
          
          {successMsg && (
            <div className="auth-alert auth-alert-success" style={{ marginBottom: '20px' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
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
                  onClick={handleInputClick}
                  autoComplete="email"
                />
                {form.email && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => {
                      setForm(prev => ({ ...prev, email: '' }));
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onClick={handleInputClick}
                  autoComplete="current-password"
                />
                {form.password && (
                  <button 
                    type="button" 
                    className="auth-clear-btn"
                    onClick={() => {
                      setForm(prev => ({ ...prev, password: '' }));
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
                <button 
                  type="button" 
                  className="auth-password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="auth-error">{errors.password}</span>}
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}