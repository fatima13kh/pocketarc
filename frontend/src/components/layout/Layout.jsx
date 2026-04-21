// src/components/layout/Layout.jsx
import Navbar from './Navbar';
import PageBanner from './PageBanner';
import Footer from './Footer';

export default function Layout({ children, title }) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title={title} />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}