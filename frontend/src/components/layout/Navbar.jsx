import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../common/Dropdown';

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

  const navLinks = user?.isAdmin ? ADMIN_LINKS : USER_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
        PocketArc
      </Link>

      {user && (
        <ul className="navbar-links">
          {navLinks.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={location.pathname === link.path ? 'active' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="navbar-right">
        {user && (
          <Dropdown
            trigger={
              <button className="navbar-profile-btn">
                Hi, {user.username} ▼
              </button>
            }
          >
            <Link to="/profile" className="dropdown-item">
              View Profile
            </Link>
            <button onClick={handleLogout} className="dropdown-item dropdown-item-logout">
              Logout
            </button>
          </Dropdown>
        )}
      </div>
    </nav>
  );
}