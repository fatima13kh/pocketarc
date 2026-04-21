import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Layout from '../components/layout/Layout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Forgot Password">
      <div className="auth-content">
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => navigate('/login')}>
            ← Back to Login
          </button>

          <h2 className="auth-card-title">Forgot Password</h2>

          <p className="text-center text-muted" style={{ marginBottom: '24px', fontSize: '13px' }}>
            Enter your email and we'll send you a reset code.
          </p>

          <Alert message={error} />

          <form onSubmit={handleSubmit}>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
            />
            <Button type="submit" fullWidth loading={loading}>
              Send Reset Code
            </Button>
          </form>

          <p className="auth-footer-text">
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}