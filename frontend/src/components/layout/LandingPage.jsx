import { useNavigate } from 'react-router-dom';
import bannerImg from '../../assets/banner.png';
import Footer from './Footer';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <span className="navbar-brand">PocketArc</span>
        <div className="navbar-right">
          {}
        </div>
      </nav>

      <div className="hero-banner">
        <img src={bannerImg} alt="" className="hero-banner-image" />
        <h1>PocketArc</h1>
        <div className="hero-banner-actions">
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Register
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>

      <div className="landing-section">
        <p>
          Learn to invest and achieve your financial goals with interactive simulations.
        </p>
        <p>
          Gain financial skills and track your progress in a risk-free environment.
        </p>

        <div className="landing-divider" />

        <h2 className="landing-why-title">Why PocketArc?</h2>
        <p>
          PocketArc helps you master financial literacy through realistic investment
          scenarios. Track your goals, earn rewards, and build confidence.
          All in a risk-free environment.
        </p>
      </div>

      <Footer />
    </div>
  );
}