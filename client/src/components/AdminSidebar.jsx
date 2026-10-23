import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faFilm,
  faBuilding,
  faCalendarAlt,
  faTicketAlt,
  faUserPlus,
  faSignOutAlt,
  faBars,
  faTimes,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from './ThemeToggle';
import './AdminSidebar.css';

/**
 * AdminSidebar – Premium collapsible navigation sidebar matching iMovies Dark Mode design system.
 * Clears admin tokens on logout and redirects to /admin-login.
 */
const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize collapsed to true on mobile so it doesn't overlay on page load
  const [collapsed, setCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Retrieve admin info stored at login
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@imovies.com';
  const adminName = localStorage.getItem('adminName') || 'Admin';

  /** Navigation items config */
  const navItems = [
    { label: 'Dashboard',        icon: faHome,        path: '/admin'              },
    { label: 'Movies',           icon: faFilm,        path: '/addmovie'           },
    { label: 'Theatres',         icon: faBuilding,    path: '/addtheatre'         },
    { label: 'Screens & Shows',  icon: faCalendarAlt, path: '/addshow'            },
    { label: 'Bookings',         icon: faTicketAlt,   path: '/adminbookings'      },
    { label: 'Transactions',     icon: faReceipt,     path: '/admin/transactions' },
    { label: 'Add Admin',        icon: faUserPlus,    path: '/addadmin'           },
  ];

  /** Check if a nav path is active */
  const isActive = (path) => location.pathname === path;

  /** Navigation click */
  const handleNav = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  /** Logout – clear tokens and navigate */
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminData');
    navigate('/admin-login');
  };

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        className="admin-sidebar__mobile-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label="Toggle sidebar"
      >
        <FontAwesomeIcon icon={collapsed ? faBars : faTimes} />
      </button>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="admin-sidebar__overlay"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}>
        {/* ── Logo & branding matching User Portal ── */}
        <div className="admin-sidebar__brand" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
          <div className="admin-sidebar__brand-logo">
            <FontAwesomeIcon icon={faFilm} className="admin-sidebar__brand-film-icon" />
          </div>
          {!collapsed && (
            <div className="admin-sidebar__brand-info">
              <span className="admin-sidebar__brand-title">iMovies</span>
              <span className="admin-sidebar__brand-badge">ADMIN</span>
            </div>
          )}
        </div>

        {/* ── Admin identity ── */}
        {!collapsed && (
          <div className="admin-sidebar__identity">
            <div className="admin-sidebar__avatar-wrapper">
              <div className="admin-sidebar__avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <span className="admin-sidebar__online-indicator" title="Online" />
            </div>
            <div className="admin-sidebar__identity-info">
              <span className="admin-sidebar__identity-name">{adminName}</span>
              <span className="admin-sidebar__identity-email">{adminEmail}</span>
            </div>
          </div>
        )}

        <div className="admin-sidebar__divider" />

        {/* ── Navigation ── */}
        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`admin-sidebar__nav-item ${isActive(item.path) ? 'admin-sidebar__nav-item--active' : ''}`}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <FontAwesomeIcon icon={item.icon} className="admin-sidebar__nav-icon" />
              {!collapsed && <span className="admin-sidebar__nav-label">{item.label}</span>}
              {isActive(item.path) && <span className="admin-sidebar__active-indicator" />}
            </button>
          ))}
        </nav>

        {/* ── Spacer ── */}
        <div className="admin-sidebar__spacer" />

        <div className="admin-sidebar__divider" />

        {/* ── Footer Actions: Theme Toggle & Logout ── */}
        <div className="admin-sidebar__footer">
          {!collapsed ? (
            <div className="admin-sidebar__footer-row">
              <span className="admin-sidebar__footer-label">Theme</span>
              <ThemeToggle />
            </div>
          ) : (
            <div className="admin-sidebar__footer-compact">
              <ThemeToggle />
            </div>
          )}

          <button
            className="admin-sidebar__logout"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="admin-sidebar__nav-icon" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
