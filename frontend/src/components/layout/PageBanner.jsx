// src/components/layout/PageBanner.jsx
import bannerImg from '../../assets/banner.png';

export default function PageBanner({ title }) {
  return (
    <div className="page-banner">
      <div className="page-banner-content">
        <h1 className="page-banner-title">{title}</h1>
      </div>
      <img src={bannerImg} alt="" className="page-banner-image" />
    </div>
  );
}