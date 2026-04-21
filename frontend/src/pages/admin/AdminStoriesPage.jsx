import Navbar from '../../components/layout/Navbar';
import PageBanner from '../../components/layout/PageBanner';
import Footer from '../../components/layout/Footer';

export default function AdminStoriesPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Admin - Manage Stories" />
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p>Admin story management coming soon...</p>
      </div>
      <Footer />
    </div>
  );
}