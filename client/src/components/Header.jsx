import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faTicketAlt,
  faHeart,
  faUser,
  faSignOutAlt,
  faShieldAlt,
  faBars,
  faTimes,
  faCompass,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('userData');
    const storedAdmin = localStorage.getItem('admin') || localStorage.getItem('adminData');
    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');
    const adminEmail = localStorage.getItem('adminEmail');

    if (adminToken) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    if (adminToken && storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin);
        setUserName(parsed.username || 'Admin');
        setUserEmail(parsed.email || adminEmail || '');
      } catch (e) {
        setUserName('Admin');
      }
    } else if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed.username || 'MovieFan');
        setUserEmail(parsed.email || '');
      } catch (e) {
        setUserName(localStorage.getItem('userName') || 'MovieFan');
      }
    } else if (localStorage.getItem('userName')) {
      setUserName(localStorage.getItem('userName'));
    } else if (adminEmail) {
      setUserName('Admin');
    } else {
      setUserName('');
      setUserEmail('');
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminData');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    setIsAdmin(false);
    setUserName('');
    setUserEmail('');
    toast.success('Logged out successfully');
    navigate('/landing');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-glass sticky-top py-2.5 px-3 px-md-4" style={{ zIndex: 1030 }}>
      <div className="container-fluid d-flex align-items-center justify-content-between">
        {/* Brand Logo - Midnight Aurora Styling */}
        <Link
          to="/home"
          className="d-flex align-items-center gap-2.5 text-decoration-none"
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-circle shadow-sm"
            style={{
              width: '40px',
              height: '40px',
              background: 'var(--aurora-gradient)',
              boxShadow: '0 0 16px var(--primary-accent-glow)',
            }}
          >
            <FontAwesomeIcon icon={faFilm} className="text-white fs-6" />
          </div>
          <span
            className="fw-extrabold fs-4 tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-accent) 60%, var(--secondary-accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            iMovies
          </span>
        </Link>

        {/* Center / Desktop Nav Links */}
        <nav className="d-none d-lg-flex align-items-center gap-1.5 ms-4 me-auto">
          <Link
            to="/home"
            className={`px-3 py-1.5 rounded-pill text-decoration-none d-flex align-items-center gap-2 transition-all fw-semibold ${
              isActive('/home')
                ? 'btn-aurora'
                : 'btn-glass'
            }`}
            style={{ fontSize: '0.88rem' }}
          >
            <FontAwesomeIcon icon={faCompass} />
            <span>Explore</span>
          </Link>

          <Link
            to="/bookings"
            className={`px-3 py-1.5 rounded-pill text-decoration-none d-flex align-items-center gap-2 transition-all fw-semibold ${
              isActive('/bookings')
                ? 'btn-aurora'
                : 'btn-glass'
            }`}
            style={{ fontSize: '0.88rem' }}
          >
            <FontAwesomeIcon icon={faTicketAlt} />
            <span>My Bookings</span>
          </Link>

          <Link
            to="/favoriteshows"
            className={`px-3 py-1.5 rounded-pill text-decoration-none d-flex align-items-center gap-2 transition-all fw-semibold ${
              isActive('/favoriteshows')
                ? 'btn-aurora'
                : 'btn-glass'
            }`}
            style={{ fontSize: '0.88rem' }}
          >
            <FontAwesomeIcon icon={faHeart} />
            <span>Watchlist</span>
          </Link>

          <Link
            to="/profile"
            className={`px-3 py-1.5 rounded-pill text-decoration-none d-flex align-items-center gap-2 transition-all fw-semibold ${
              isActive('/profile')
                ? 'btn-aurora'
                : 'btn-glass'
            }`}
            style={{ fontSize: '0.88rem' }}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Profile</span>
          </Link>
        </nav>

        {/* Right Controls: Theme Toggle + User / Auth + Hamburger */}
        <div className="d-flex align-items-center gap-2 gap-sm-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Admin Badge */}
          {isAdmin && (
            <Link
              to="/admin"
              className="btn btn-sm btn-outline-warning d-none d-sm-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
              style={{ fontSize: '0.82rem', fontWeight: 600 }}
            >
              <FontAwesomeIcon icon={faShieldAlt} />
              <span>Admin</span>
            </Link>
          )}

          {/* User Profile / Auth State */}
          {(userName || localStorage.getItem('userToken') || localStorage.getItem('adminToken')) ? (
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/profile"
                className="d-flex align-items-center gap-2 px-2.5 py-1 rounded-pill text-decoration-none btn-glass"
                style={{ fontSize: '0.85rem' }}
                title="View Profile"
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: '28px',
                    height: '28px',
                    fontSize: '0.82rem',
                    background: 'var(--aurora-gradient)',
                  }}
                >
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
                <span
                  className="fw-semibold text-truncate d-none d-md-inline"
                  style={{ maxWidth: '110px', color: 'var(--text-primary)' }}
                >
                  {userName || 'User'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.82rem', fontWeight: 600 }}
                title="Logout"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span className="d-none d-sm-inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/login"
                className="btn-glass px-3 py-1 text-decoration-none"
                style={{ fontSize: '0.85rem' }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-aurora px-3 py-1 text-decoration-none"
                style={{ fontSize: '0.85rem' }}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="d-lg-none btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={() => setNavCollapsed(!navCollapsed)}
            aria-label="Toggle navigation menu"
          >
            <FontAwesomeIcon icon={navCollapsed ? faBars : faTimes} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {!navCollapsed && (
        <div
          className="d-lg-none pt-3 pb-2 px-2 mt-2 border-top"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="d-flex flex-column gap-2">
            <Link
              to="/home"
              className={`px-3 py-2 rounded-3 text-decoration-none d-flex align-items-center gap-2.5 ${
                isActive('/home') ? 'btn-aurora' : 'btn-glass'
              }`}
              onClick={() => setNavCollapsed(true)}
            >
              <FontAwesomeIcon icon={faCompass} />
              <span>Explore</span>
            </Link>

            <Link
              to="/bookings"
              className={`px-3 py-2 rounded-3 text-decoration-none d-flex align-items-center gap-2.5 ${
                isActive('/bookings') ? 'btn-aurora' : 'btn-glass'
              }`}
              onClick={() => setNavCollapsed(true)}
            >
              <FontAwesomeIcon icon={faTicketAlt} />
              <span>My Bookings</span>
            </Link>

            <Link
              to="/favoriteshows"
              className={`px-3 py-2 rounded-3 text-decoration-none d-flex align-items-center gap-2.5 ${
                isActive('/favoriteshows') ? 'btn-aurora' : 'btn-glass'
              }`}
              onClick={() => setNavCollapsed(true)}
            >
              <FontAwesomeIcon icon={faHeart} />
              <span>Watchlist</span>
            </Link>

            <Link
              to="/profile"
              className={`px-3 py-2 rounded-3 text-decoration-none d-flex align-items-center gap-2.5 ${
                isActive('/profile') ? 'btn-aurora' : 'btn-glass'
              }`}
              onClick={() => setNavCollapsed(true)}
            >
              <FontAwesomeIcon icon={faUser} />
              <span>Profile</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="px-3 py-2 rounded-3 text-decoration-none d-flex align-items-center gap-2.5 btn btn-warning text-dark fw-bold"
                onClick={() => setNavCollapsed(true)}
              >
                <FontAwesomeIcon icon={faShieldAlt} />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
