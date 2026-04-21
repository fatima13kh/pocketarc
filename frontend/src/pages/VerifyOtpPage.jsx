import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import OtpInput from '../components/common/OtpInput';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setApiError('Please enter all 6 digits'); return; }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, code });
      login(res.data.token, {
        username: res.data.username,
        email: res.data.email,
        isAdmin: res.data.isAdmin,
      });
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setApiError('');
    try {
      await authApi.resendOtp({ email });
      setSuccessMsg('A new code has been sent to your email.');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <Layout title="Verify OTP">
      <div className="auth-content">
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => navigate('/register')}>
            ← Back to Register
          </button>

          <h2 className="auth-card-title">Verify OTP</h2>

          <p className="text-center text-muted" style={{ marginBottom: '24px', fontSize: '13px' }}>
            Please enter the verification code sent to your email
          </p>

          <Alert message={apiError} />
          <Alert type="success" message={successMsg} />

          <form onSubmit={handleSubmit}>
            <OtpInput value={otp} onChange={setOtp} />
            <Button type="submit" fullWidth loading={loading}>
              Verify
            </Button>
          </form>

          <p className="auth-footer-text">
            Didn't receive a code?{' '}
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-h)',
                fontWeight: 500,
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                opacity: countdown > 0 ? 0.5 : 1,
                fontSize: '13px',
                padding: 0,
              }}
            >
              {resending
                ? 'Sending...'
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : 'Resend code'}
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
}