import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';

const Loader = ({ message = 'Loading iMovies...' }) => {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="position-relative mb-3">
        <div
          className="spinner-border"
          role="status"
          style={{
            width: '4rem',
            height: '4rem',
            borderWidth: '4px',
            color: 'var(--primary-accent)',
            filter: 'drop-shadow(0 0 10px var(--primary-accent-glow))',
          }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <div
          className="position-absolute top-50 start-50 translate-middle"
          style={{ fontSize: '1.2rem', color: 'var(--secondary-accent)' }}
        >
          <FontAwesomeIcon icon={faFilm} className="fa-spin" />
        </div>
      </div>
      <h5
        className="fw-bold tracking-wide"
        style={{ letterSpacing: '2px', color: 'var(--primary-accent)' }}
      >
        {message}
      </h5>
      <p style={{ color: 'var(--text-secondary)' }} className="small">
        Preparing your cinematic experience...
      </p>
    </div>
  );
};

export default Loader;
