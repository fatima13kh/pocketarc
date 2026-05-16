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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState({
    username: '', email: '', phoneNumber: '',
    currentPassword: '', newPassword: '',
  });
  const [deleteForm, setDeleteForm] = useState({ confirmation: '', password: '' });
  const [errors, setErrors] = useState({});
  const [deleteErrors, setDeleteErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/users/me');
      setProfile(res.data);
      setForm({
        username: res.data.username,
        email: res.data.email,
        phoneNumber: res.data.phoneNumber || '',
        currentPassword: '',
        newPassword: '',
      });
    } catch {
      setApiError('Failed to load profile');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setApiError('');
    setSuccessMsg('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) {
      setErrors({ currentPassword: 'Current password is required' });
      return;
    }
    setSaving(true);
    try {
      const res = await axiosClient.patch('/users/me', form);
      setProfile(res.data);
      setSuccessMsg('Profile updated successfully.');
      setIsEditing(false);
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

      <div className="profile-content">
        <div className="profile-card">

          {/* Header buttons — view mode only */}
          {!isEditing && !showDelete && (
            <div className="profile-card-header">
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                Delete Profile
              </Button>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            </div>
          )}

          <h2 className="profile-card-title">Details</h2>

          <Alert message={apiError} />
          <Alert type="success" message={successMsg} />

          {/* ── VIEW ── */}
          {!isEditing && !showDelete && (
            <>
              <div className="profile-field">
                <p className="profile-field-label">Username</p>
                <p className="profile-field-value">{profile?.username}</p>
              </div>
              <div className="profile-field">
                <p className="profile-field-label">Email</p>
                <p className="profile-field-value">{profile?.email}</p>
              </div>
              {!profile?.isAdmin && (
                <div className="profile-field">
                  <p className="profile-field-label">Phone Number</p>
                  <p className="profile-field-value">{profile?.phoneNumber || '—'}</p>
                </div>
              )}
            </>
          )}

          {/* ── EDIT ── */}
          {isEditing && !showDelete && (
            <form onSubmit={handleUpdate}>
              <Input
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                error={errors.username}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />
              {!profile?.isAdmin && (
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  error={errors.phoneNumber}
                />
              )}
              <Input
                label="Confirm Password"
                name="currentPassword"
                type="password"
                placeholder="Enter current password to save"
                value={form.currentPassword}
                onChange={handleChange}
                error={errors.currentPassword}
              />
              <Input
                label="New Password (optional)"
                name="newPassword"
                type="password"
                placeholder="Leave blank to keep current"
                value={form.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => { setIsEditing(false); setErrors({}); setApiError(''); }}
                >
                  Cancel
                </Button>
                <Button type="submit" fullWidth loading={saving}>
                  Edit Profile
                </Button>
              </div>
            </form>
          )}

          {/* ── DELETE ── */}
          {showDelete && (
            <form onSubmit={handleDelete}>
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                <strong>This action is permanent.</strong> Your account and all
                data will be deleted and cannot be recovered.
              </div>

              <Alert message={deleteErrors.api} />

              <Input
                label='Type "DELETE" to confirm'
                name="confirmation"
                placeholder="DELETE"
                value={deleteForm.confirmation}
                onChange={e => setDeleteForm(p => ({ ...p, confirmation: e.target.value }))}
                error={deleteErrors.confirmation}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={deleteForm.password}
                onChange={e => setDeleteForm(p => ({ ...p, password: e.target.value }))}
                error={deleteErrors.password}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowDelete(false);
                    setDeleteForm({ confirmation: '', password: '' });
                    setDeleteErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" fullWidth loading={deleting}>
                  Delete Account
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}