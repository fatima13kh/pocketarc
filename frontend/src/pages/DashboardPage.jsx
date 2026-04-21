import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Dashboard" />
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h2>Welcome, {user?.username}!</h2>
        <p>Dashboard coming soon.</p>
      </div>
      <Footer />
    </div>
  );
}