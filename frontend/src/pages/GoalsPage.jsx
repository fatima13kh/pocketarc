import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';

export default function GoalsPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Savings Goals" />
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p>Savings Goals coming soon.</p>
      </div>
      <Footer />
    </div>
  );
}