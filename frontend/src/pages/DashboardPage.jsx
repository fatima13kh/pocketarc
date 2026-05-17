// src/pages/DashboardPage.jsx (Simplified - no extra loading)
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { loading, error, userDashboard, adminDashboard } = useDashboard();

  if (loading && !userDashboard && !adminDashboard) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Dashboard" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Dashboard" />
        <div style={{ padding: '40px' }}>
          <Alert message={error} />
        </div>
        <Footer />
      </div>
    );
  }

  if (user?.isAdmin) {
    return <AdminDashboard />;
  }
  
  return <UserDashboard />;
}