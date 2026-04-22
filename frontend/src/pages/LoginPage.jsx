import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { validateLogin } from '../validation/userValidation';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Timeout references
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [successTimeout, setSuccessTimeout] = useState(null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clear success message after 10 seconds
      const timeout = setTimeout(() => {
        setSuccessMsg('');
      }, 10000);
      setSuccessTimeout(timeout);
    }
    return () => {
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, [location.state]);

  // Clear API error after 10 seconds
  useEffect(() => {
    if (apiError) {
      if (errorTimeout) clearTimeout(errorTimeout);
      const timeout = setTimeout(() => {
        setApiError('');
      }, 10000);
      setErrorTimeout(timeout);
    }
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [apiError]);

  // Clear validation errors after 10 seconds
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      if (errorTimeout) clearTimeout(errorTimeout);
      const timeout = setTimeout(() => {
        setErrors({});
      }, 10000);
      setErrorTimeout(timeout);
    }
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    
    setErrors({});
    
    const errs = validateLogin(form.email, form.password);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

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
      setApiError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear API error when user clicks on the input
  const handleClearApiError = () => {
    setApiError('');
  };

  return (
    <Layout title="Log In">
      <div className="auth-content">
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>

          <h2 className="auth-card-title">Log In</h2>

          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {apiError}
            </div>
          )}
          
          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              onClick={handleClearApiError}
              error={errors.email}
              autoComplete="email"
              required
              showClear
            />

            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              onClick={handleClearApiError}
              error={errors.password}
              autoComplete="current-password"
              required
              showClear
            />

            <div className="forgot-password-link">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Log In
            </Button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}