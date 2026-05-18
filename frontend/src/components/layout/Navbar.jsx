// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../common/Dropdown';
import { FaBars, FaTimes } from 'react-icons/fa';

const USER_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Goals', path: '/goals' },
  { label: 'Simulator', path: '/simulator' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Stories', path: '/stories' },
];

const ADMIN_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Stories', path: '/admin/stories' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = user?.isAdmin ? ADMIN_LINKS : USER_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="navbar-brand" onClick={handleLinkClick}>
        PocketArc
      </Link>

      {/* Desktop Navigation */}
      {user && (
        <ul className="navbar-links desktop-nav">
          {navLinks.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={location.pathname === link.path ? 'active' : ''}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Mobile Hamburger Icon */}
      <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && user && (
        <div className="mobile-nav-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            ))}
            <div className="mobile-nav-divider" />
            <Link to="/profile" className="mobile-nav-link" onClick={handleLinkClick}>
              View Profile
            </Link>
            <button onClick={handleLogout} className="mobile-nav-logout">
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Right Section (Profile Dropdown) */}
      {user && (
        <div className="navbar-right desktop-nav">
          <Dropdown
            trigger={
              <button className="navbar-profile-btn">
                Hi, {user.username} ▼
              </button>
            }
          >
            <Link to="/profile" className="dropdown-item" onClick={handleLinkClick}>
              View Profile
            </Link>
            <button onClick={handleLogout} className="dropdown-item dropdown-item-logout">
              Logout
            </button>
          </Dropdown>
        </div>
      )}
    </nav>
  );
}