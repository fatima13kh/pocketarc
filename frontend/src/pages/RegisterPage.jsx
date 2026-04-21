import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Layout from '../components/layout/Layout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { validateRegister } from '../validation/userValidation';

const INITIAL = {
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorTimeout, setErrorTimeout] = useState(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (apiError || Object.keys(errors).length > 0) {
      if (errorTimeout) clearTimeout(errorTimeout);
      const timeout = setTimeout(() => {
        setApiError('');
        setErrors({});
      }, 5000);
      setErrorTimeout(timeout);
    }
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [apiError, errors]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setApiError('');
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
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Register">
      <div className="auth-content">
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>

          <h2 className="auth-card-title">Register</h2>

          <Alert message={apiError} />

          <form onSubmit={handleSubmit} noValidate>
            <Input
              name="username"
              label="Username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              autoComplete="username"
              required
              showClear
            />
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
              required
              showClear
            />
            <Input
              name="phoneNumber"
              type="tel"
              label="Phone Number"
              placeholder="8 digits (e.g., 39994093)"
              value={form.phoneNumber}
              onChange={handleChange}
              error={errors.phoneNumber}
              autoComplete="tel"
              required
              showClear
            />
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
              required
              showClear
            />
            <Input
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
              showClear
            />
            <Button type="submit" fullWidth loading={loading}>
              Next
            </Button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}