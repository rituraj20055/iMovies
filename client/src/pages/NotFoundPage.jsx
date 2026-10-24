import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faHome,
  faArrowLeft,
  faCompass,
  faExclamationTriangle,
  faTicketAlt,
} from '@fortawesome/free-solid-svg-icons';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const userToken = localStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');

  // Determine intelligent home destination based on current user role
  const homePath = adminToken ? '/admin' : userToken ? '/home' : '/landing';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.25s ease',
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Aurora background glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'var(--aurora-gradient)',
            opacity: 0.08,
            filter: 'blur(100px)',
            pointerEvents: 'none',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Animated 404 Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              background: 'var(--aurora-gradient-subtle)',
              border: '1px solid var(--border-active)',
              color: 'var(--primary-accent)',
              fontSize: '2.5rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <FontAwesomeIcon icon={faFilm} />
          </div>

          <div
            style={{
              fontSize: '5rem',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-2px',
              background: 'var(--aurora-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.75rem',
            }}
          >
            404
          </div>

          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Scene Not Found
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              maxWidth: '440px',
              marginInline: 'auto',
            }}
          >
            Looks like this reel went missing or the URL was mistyped.
            Let's get you back to the main feature.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-accent)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Go Back
            </button>

            <Link
              to={homePath}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--aurora-gradient)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-glow)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.92';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FontAwesomeIcon icon={faHome} />
              Return Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
