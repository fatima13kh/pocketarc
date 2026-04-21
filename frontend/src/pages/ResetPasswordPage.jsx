import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Layout from '../components/layout/Layout';
import OtpInput from '../components/common/OtpInput';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  const validate = () => {
    const e = {};
    if (otp.join('').length < 6) e.otp = 'Please enter all 6 digits';
    if (!newPassword) e.newPassword = 'Password is required';
    else if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(newPassword))
      e.newPassword = 'Must include uppercase, number, and special character';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, code: otp.join(''), newPassword });
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Reset Password">
      <div className="auth-content">
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => navigate('/forgot-password')}>
            ← Back
          </button>

          <h2 className="auth-card-title">Reset Password</h2>

          <p className="text-center text-muted" style={{ marginBottom: '24px', fontSize: '13px' }}>
            Enter the code sent to your email and your new password.
          </p>

          <Alert message={apiError} />

          <form onSubmit={handleSubmit}>
            <OtpInput value={otp} onChange={setOtp} />
            {errors.otp && <p className="form-error text-center">{errors.otp}</p>}

            <Input
              name="newPassword"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: '' })); }}
              error={errors.newPassword}
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })); }}
              error={errors.confirmPassword}
            />

            <Button type="submit" fullWidth loading={loading}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}