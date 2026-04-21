import { useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';

export default function StoryPlayPage() {
  const { id } = useParams();
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Play Story" />
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p>Playing story #{id}...</p>
        <p>Story player coming soon.</p>
      </div>
      <Footer />
    </div>
  );
}