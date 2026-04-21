import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';

export default function InvestmentStoriesPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Investment Stories" />
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p>Investment Stories coming soon.</p>
      </div>
      <Footer />
    </div>
  );
}