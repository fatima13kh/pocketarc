import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';

export default function InvestmentSimulatorPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Investment Simulator" />
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p>Investment Simulator coming soon.</p>
      </div>
      <Footer />
    </div>
  );
}