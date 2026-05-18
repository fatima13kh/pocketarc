// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import Footer from '../components/layout/Footer';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Edit profile form (no password fields)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
  });

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteForm, setDeleteForm] = useState({ confirmation: '', password: '' });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [deleteErrors, setDeleteErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/users/me');
      setProfile(res.data);
      setEditForm({
        username: res.data.username,
        email: res.data.email,
        phoneNumber: res.data.phoneNumber || '',
      });
    } catch {
      setApiError('Failed to load profile');
    } finally {
      setPageLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
    setSuccessMsg('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');
    
    try {
      const res = await axiosClient.patch('/users/me', editForm);
      setProfile(res.data);
      setSuccessMsg('Profile updated successfully.');
      setIsEditing(false);
      // Update auth context with new username/email
      const token = localStorage.getItem('token');
      login(token, {
        username: res.data.username,
        email: res.data.email,
        isAdmin: res.data.isAdmin,
      });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Must include at least 1 uppercase letter';
    } else if (!/(?=.*[0-9])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Must include at least 1 number';
    } else if (!/(?=.*[!@#$%^&*])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Must include at least 1 special character';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setChangingPassword(true);
    setApiError('');
    
    try {
      await axiosClient.patch('/users/me', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccessMsg('Password changed successfully.');
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteErrors({});
    if (deleteForm.confirmation !== 'DELETE') {
      setDeleteErrors({ confirmation: 'Please type DELETE to confirm' });
      return;
    }
    if (!deleteForm.password) {
      setDeleteErrors({ password: 'Password is required' });
      return;
    }
    setDeleting(true);
    try {
      await axiosClient.delete('/users/me', { data: deleteForm });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteErrors({ api: err.response?.data?.error || 'Failed to delete account' });
    } finally {
      setDeleting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Profile" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Profile" />

      <div className="auth-page">
        <div className="auth-card-new">

          {/* Header buttons */}
          {!isEditing && !isChangingPassword && !showDelete && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                Delete Profile
              </Button>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            </div>
          )}

          <h2 className="auth-title">
            {isEditing ? 'Edit Profile' : isChangingPassword ? 'Change Password' : 'Profile Details'}
          </h2>

          {apiError && <div className="auth-alert auth-alert-error">{apiError}</div>}
          {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

          {/* ── VIEW MODE ── */}
          {!isEditing && !isChangingPassword && !showDelete && (
            <>
              <div className="auth-form-group">
                <label className="auth-label">Username</label>
                <div className="auth-input-wrapper">
                  <input type="text" className="auth-input" value={profile?.username} disabled />
                </div>
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <input type="email" className="auth-input" value={profile?.email} disabled />
                </div>
              </div>
              {!profile?.isAdmin && (
                <div className="auth-form-group">
                  <label className="auth-label">Phone Number</label>
                  <div className="auth-input-wrapper">
                    <input type="tel" className="auth-input" value={profile?.phoneNumber || '—'} disabled />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── EDIT PROFILE MODE ── */}
          {isEditing && !showDelete && (
            <form onSubmit={handleUpdateProfile}>
              <div className="auth-form-group">
                <label className="auth-label">Username</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    name="username"
                    className={`auth-input ${errors.username ? 'error' : ''}`}
                    value={editForm.username}
                    onChange={handleEditChange}
                    placeholder="Enter username"
                  />
                  {editForm.username && (
                    <button type="button" className="auth-clear-btn" onClick={() => setEditForm(prev => ({ ...prev, username: '' }))}>
                      <FaTimes />
                    </button>
                  )}
                </div>
                {errors.username && <span className="auth-error">{errors.username}</span>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <input
                    type="email"
                    name="email"
                    className={`auth-input ${errors.email ? 'error' : ''}`}
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="Enter email"
                  />
                  {editForm.email && (
                    <button type="button" className="auth-clear-btn" onClick={() => setEditForm(prev => ({ ...prev, email: '' }))}>
                      <FaTimes />
                    </button>
                  )}
                </div>
                {errors.email && <span className="auth-error">{errors.email}</span>}
              </div>

              {!profile?.isAdmin && (
                <div className="auth-form-group">
                  <label className="auth-label">Phone Number</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="tel"
                      name="phoneNumber"
                      className={`auth-input ${errors.phoneNumber ? 'error' : ''}`}
                      value={editForm.phoneNumber}
                      onChange={handleEditChange}
                      placeholder="8 digits (e.g., 39994093)"
                    />
                    {editForm.phoneNumber && (
                      <button type="button" className="auth-clear-btn" onClick={() => setEditForm(prev => ({ ...prev, phoneNumber: '' }))}>
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  {errors.phoneNumber && <span className="auth-error">{errors.phoneNumber}</span>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="auth-btn" style={{ background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)' }} onClick={() => { setIsEditing(false); setErrors({}); setApiError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ── CHANGE PASSWORD MODE ── */}
          {isChangingPassword && !showDelete && (
            <form onSubmit={handleChangePassword}>
              <div className="auth-form-group">
                <label className="auth-label">Current Password</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    className={`auth-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="auth-error">{passwordErrors.currentPassword}</span>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">New Password</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    className={`auth-input ${passwordErrors.newPassword ? 'error' : ''}`}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordErrors.newPassword && <span className="auth-error">{passwordErrors.newPassword}</span>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={`auth-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <span className="auth-error">{passwordErrors.confirmPassword}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="auth-btn" style={{ background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)' }} onClick={() => { setIsChangingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordErrors({}); }}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn" disabled={changingPassword}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* ── DELETE MODE ── */}
          {showDelete && (
            <form onSubmit={handleDelete}>
              <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
                <strong>⚠️ This action is permanent.</strong> Your account and all data will be deleted and cannot be recovered.
              </div>

              {deleteErrors.api && <div className="auth-alert auth-alert-error">{deleteErrors.api}</div>}

              <div className="auth-form-group">
                <label className="auth-label">Type "DELETE" to confirm</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    name="confirmation"
                    className="auth-input"
                    placeholder="DELETE"
                    value={deleteForm.confirmation}
                    onChange={e => setDeleteForm(prev => ({ ...prev, confirmation: e.target.value }))}
                  />
                </div>
                {deleteErrors.confirmation && <span className="auth-error">{deleteErrors.confirmation}</span>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    type="password"
                    name="password"
                    className="auth-input"
                    placeholder="Enter your password"
                    value={deleteForm.password}
                    onChange={e => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                {deleteErrors.password && <span className="auth-error">{deleteErrors.password}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="auth-btn" style={{ background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)' }} onClick={() => { setShowDelete(false); setDeleteForm({ confirmation: '', password: '' }); setDeleteErrors({}); }}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn" style={{ background: 'var(--error)' }} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}