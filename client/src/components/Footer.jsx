import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faHeart, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF,
  faTwitter,
  faInstagram,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer
      className="pt-5 pb-4 mt-auto"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div className="container">
        <div className="row g-4 justify-content-between">
          {/* Brand info */}
          <div className="col-12 col-md-4">
            <Link to="/home" className="d-flex align-items-center gap-2 text-decoration-none mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--aurora-gradient)',
                }}
              >
                <FontAwesomeIcon icon={faFilm} className="text-white small" />
              </div>
              <span
                className="fw-extrabold fs-4"
                style={{
                  background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-accent) 60%, var(--secondary-accent) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                iMovies
              </span>
            </Link>
            <p className="small mb-3 pe-md-4" style={{ color: 'var(--text-secondary)' }}>
              Your premium destination for discovering the latest market blockbusters and reserving prime cinema seats in real-time.
            </p>
            <div className="d-flex gap-3">
              <a href="#facebook" className="btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#twitter" className="btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#instagram" className="btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#youtube" className="btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                <FontAwesomeIcon icon={faYoutube} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-6 col-md-2">
            <h6 className="fw-bold mb-3 text-uppercase tracking-wider small" style={{ color: 'var(--text-primary)' }}>Explore</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/home" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/home" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  Trending Movies
                </Link>
              </li>
              <li>
                <Link to="/favoriteshows" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  Watchlist
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Account / Support */}
          <div className="col-6 col-md-2">
            <h6 className="fw-bold mb-3 text-uppercase tracking-wider small" style={{ color: 'var(--text-primary)' }}>Account</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/profile" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  Tickets History
                </Link>
              </li>
              <li>
                <Link to="/favoriteshows" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                  Saved Shows
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Badges */}
          <div className="col-12 col-md-3">
            <h6 className="fw-bold mb-3 text-uppercase tracking-wider small" style={{ color: 'var(--text-primary)' }}>
              Guaranteed Experience
            </h6>
            <p className="small mb-3" style={{ color: 'var(--text-secondary)' }}>
              10-minute real-time seat locks, test-mode payment gateway integration, and instant electronic tickets.
            </p>
            <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="small fw-bold d-flex align-items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <FontAwesomeIcon icon={faShieldAlt} style={{ color: 'var(--primary-accent)' }} />
                <span>Verified Booking</span>
              </div>
              <div className="small" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Live Seat Status • Zero Double-Bookings</div>
            </div>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small" style={{ color: 'var(--text-muted)' }}>
          <div>
            &copy; {new Date().getFullYear()} <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>iMovies</span>. All rights reserved.
          </div>
          <div className="d-flex align-items-center gap-1">
            <span>Crafted with</span>
            <FontAwesomeIcon icon={faHeart} style={{ color: 'var(--secondary-accent)' }} />
            <span>for cinema lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
