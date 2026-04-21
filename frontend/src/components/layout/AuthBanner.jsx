// src/components/layout/AuthBanner.jsx
import { useNavigate } from 'react-router-dom';
import bannerImg from '../../assets/banner.png';

export default function AuthBanner() {
  const navigate = useNavigate();

  return (
    <div className="banner banner-auth">
      <img src={bannerImg} alt="" className="banner-image" />
      <h1 className="banner-title">PocketArc</h1>
      <div className="banner-auth-actions">
        <button className="btn btn-primary" onClick={() => navigate('/register')}>
          Register
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </div>
    </div>
  );
}