import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faStar,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faPlay,
  faBolt,
  faCouch,
  faCompass,
  faShieldAlt,
  faTicketAlt,
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import { deduplicateMovies } from '../utils/movieUtils';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

/* Feature cards data */
const FEATURES = [
  {
    icon: faBolt,
    title: 'Real-time Booking',
    desc: 'Live seat availability updates powered by WebSocket technology. Zero double bookings guaranteed.',
  },
  {
    icon: faCheckCircle,
    title: 'Instant E-Tickets',
    desc: 'Receive digital tickets and barcode passes directly to your profile and email immediately upon booking.',
  },
  {
    icon: faCouch,
    title: 'Interactive Seat Map',
    desc: 'Select preferred seats across Balcony, Middle, and Lower tiers with 10-minute lock protection.',
  },
];

/* Stats data */
const STATS = [
  { number: '500+', label: 'Blockbusters' },
  { number: '100+', label: 'Cinema Screens' },
  { number: '1M+', label: 'Movie Fans' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const { isDark } = useTheme();

  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

  /* Hover states */
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredPrimary, setHoveredPrimary] = useState(false);
  const [hoveredOutline, setHoveredOutline] = useState(false);

  /* Fetch featured movies */
  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/api/movie/featured');
        if (isMounted) {
          const list = res.data?.movies || res.data || [];
          setFeaturedMovies(deduplicateMovies(list));
        }
      } catch {
        if (isMounted) {
          setFeaturedMovies([]);
        }
      } finally {
        if (isMounted) setLoadingMovies(false);
      }
    };
    fetchFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  /* Carousel scroll */
  const scrollCarousel = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 550, behavior: 'smooth' });
  };

  /* Keyframe animations */
  useEffect(() => {
    const id = 'imovies-landing-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes floatPulse {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes shimmer {
        0% { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .imovies-carousel::-webkit-scrollbar { display: none; }
      .imovies-movie-card:hover {
        transform: translateY(-6px) scale(1.03);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
      }
      .imovies-feature-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        backgroundColor: isDark ? 'var(--bg-primary)' : '#F3F6FC',
        color: isDark ? '#FFFFFF' : '#111827',
        minHeight: '100vh',
        overflowX: 'hidden',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* ── TOP NAVIGATION BAR ────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: isDark ? 'rgba(8, 13, 27, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
          padding: '12px 24px',
          transition: 'all 0.25s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            to="/home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--aurora-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px var(--primary-accent-glow)',
              }}
            >
              <FontAwesomeIcon icon={faFilm} style={{ color: '#fff', fontSize: '1rem' }} />
            </div>
            <span
              style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: isDark ? '#FFFFFF' : '#111827',
              }}
            >
              i<span style={{ color: 'var(--primary-accent)' }}>Movies</span>
            </span>
          </Link>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: isDark ? 'var(--text-secondary)' : '#4B5563',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'color 0.2s',
              }}
            >
              <FontAwesomeIcon icon={faCompass} />
              <span>Explore</span>
            </Link>

            {/* Universal Theme Toggle */}
            <ThemeToggle />

            {/* Auth Buttons */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : '#D1D5DB'}`,
                color: isDark ? '#FFFFFF' : '#111827',
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                background: 'var(--aurora-gradient)',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px var(--primary-accent-glow)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '82vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '60px 20px',
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'radial-gradient(ellipse at 30% 40%, rgba(54, 217, 255, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.10) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 30% 30%, rgba(8, 126, 164, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(116, 85, 217, 0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '840px',
            margin: '0 auto',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(54, 217, 255, 0.12)' : 'rgba(8, 126, 164, 0.10)',
              border: `1px solid ${isDark ? 'rgba(54, 217, 255, 0.3)' : 'rgba(8, 126, 164, 0.25)'}`,
              color: 'var(--primary-accent)',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '24px',
            }}
          >
            <FontAwesomeIcon icon={faTicketAlt} />
            <span>Next-Generation Cinema Experience</span>
          </div>

          {/* Heading - explicitly readable in both modes */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6.5vw, 4.2rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-0.03em',
              color: isDark ? '#FFFFFF' : '#111827',
              ...(isDark
                ? {
                    background: 'linear-gradient(135deg, #FFFFFF 40%, var(--primary-accent) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }
                : {
                    color: '#111827',
                  }),
            }}
          >
            Welcome to <span style={{ color: 'var(--primary-accent)' }}>iMovies</span>
          </h1>

          {/* Subtitle - explicitly set to #4B5563 in Light Mode */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
              color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#4B5563',
              marginBottom: '40px',
              lineHeight: 1.6,
              maxWidth: '620px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Your ultimate destination for the latest blockbusters and timeless classics.
            Book your perfect seats in seconds with instant confirmation.
          </p>

          {/* Call to Actions */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            <button
              type="button"
              style={{
                backgroundColor: 'var(--aurora-gradient)',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: '0 4px 18px var(--primary-accent-glow)',
                padding: '14px 36px',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hoveredPrimary ? 'scale(1.03)' : 'scale(1)',
              }}
              onMouseEnter={() => setHoveredPrimary(true)}
              onMouseLeave={() => setHoveredPrimary(false)}
              onClick={() => navigate('/register')}
            >
              Sign Up — It's Free
            </button>

            <button
              type="button"
              style={{
                color: isDark ? '#FFFFFF' : '#111827',
                border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.4)' : '#D1D5DB'}`,
                padding: '14px 34px',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: hoveredOutline
                  ? isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : '#F9FAFB'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : '#FFFFFF',
              }}
              onMouseEnter={() => setHoveredOutline(true)}
              onMouseLeave={() => setHoveredOutline(false)}
              onClick={() => navigate('/home')}
            >
              Browse Movies →
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: isDark ? 'var(--bg-card)' : '#FFFFFF',
          borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
          borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
          padding: '28px 20px',
          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div
          style={{
            maxWidth: '920px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <span
                style={{
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: 'var(--primary-accent)',
                  display: 'block',
                  lineHeight: 1.2,
                }}
              >
                {s.number}
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: isDark ? 'var(--text-secondary)' : '#4B5563',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED MOVIES CAROUSEL ──────────────────────────────── */}
      <section
        style={{
          padding: '70px 20px',
          maxWidth: '1260px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <FontAwesomeIcon icon={faStar} style={{ color: 'var(--primary-accent)', fontSize: '1.3rem' }} />
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: isDark ? '#FFFFFF' : '#111827',
              margin: 0,
            }}
          >
            Featured Blockbusters
          </h2>
          <div
            style={{
              flex: 1,
              height: '2px',
              background: 'var(--aurora-gradient)',
              borderRadius: '2px',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          {/* Scroll Left */}
          <button
            type="button"
            onClick={() => scrollCarousel(-1)}
            aria-label="Scroll left"
            style={{
              position: 'absolute',
              top: '50%',
              left: '-16px',
              transform: 'translateY(-50%)',
              zIndex: 3,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(17, 26, 46, 0.9)' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#D1D5DB'}`,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          {/* Carousel Track */}
          <div
            ref={trackRef}
            className="imovies-carousel"
            style={{
              display: 'flex',
              gap: '18px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              paddingBottom: '16px',
            }}
          >
            {loadingMovies ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '190px',
                    height: '310px',
                    borderRadius: '14px',
                    backgroundColor: isDark ? 'var(--bg-card)' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
                    flexShrink: 0,
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      height: '220px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'var(--bg-surface)' : '#E5E7EB',
                    }}
                  />
                  <div
                    style={{
                      height: '14px',
                      width: '80%',
                      backgroundColor: isDark ? 'var(--bg-surface)' : '#E5E7EB',
                      marginTop: '12px',
                      borderRadius: '4px',
                    }}
                  />
                  <div
                    style={{
                      height: '12px',
                      width: '50%',
                      backgroundColor: isDark ? 'var(--bg-surface)' : '#E5E7EB',
                      marginTop: '8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              ))
            ) : featuredMovies.length > 0 ? (
              featuredMovies.map((movie) => {
                const title = movie.movieName || movie.title || 'Movie';
                const poster =
                  movie.poster ||
                  movie.posterUrl ||
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
                return (
                  <div
                    key={movie._id}
                    className="imovies-movie-card"
                    onClick={() => navigate(`/moviedetails/${movie._id}`)}
                    style={{
                      flexShrink: 0,
                      width: '190px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      backgroundColor: isDark ? 'var(--bg-card)' : '#FFFFFF',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
                      cursor: 'pointer',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      boxShadow: isDark
                        ? '0 4px 14px rgba(0, 0, 0, 0.25)'
                        : '0 4px 14px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <img
                      src={poster}
                      alt={title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '250px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
                      }}
                    />
                    <div style={{ padding: '12px' }}>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: isDark ? '#FFFFFF' : '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '4px',
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'var(--text-secondary)' : '#6B7280',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || 'Cinema'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: isDark ? 'var(--text-muted)' : '#6B7280', fontSize: '0.95rem' }}>
                Featured blockbusters are currently synchronizing.
              </p>
            )}
          </div>

          {/* Scroll Right */}
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            aria-label="Scroll right"
            style={{
              position: 'absolute',
              top: '50%',
              right: '-16px',
              transform: 'translateY(-50%)',
              zIndex: 3,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(17, 26, 46, 0.9)' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#D1D5DB'}`,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: isDark ? 'var(--bg-secondary)' : '#FFFFFF',
          borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
          borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
          padding: '70px 20px',
        }}
      >
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <FontAwesomeIcon icon={faPlay} style={{ color: 'var(--primary-accent)', fontSize: '1.2rem' }} />
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: isDark ? '#FFFFFF' : '#111827',
                margin: 0,
              }}
            >
              Why Choose iMovies?
            </h2>
            <div
              style={{
                flex: 1,
                height: '2px',
                background: 'var(--aurora-gradient)',
                borderRadius: '2px',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="imovies-feature-card"
                style={{
                  backgroundColor: isDark ? 'var(--bg-card)' : '#F9FAFB',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
                  borderRadius: '16px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  transition: 'all 0.25s ease',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: isDark ? 'rgba(54, 217, 255, 0.12)' : 'rgba(8, 126, 164, 0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '1.6rem',
                    color: 'var(--primary-accent)',
                  }}
                >
                  <FontAwesomeIcon icon={f.icon} />
                </div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    color: isDark ? '#FFFFFF' : '#111827',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: isDark ? 'var(--text-secondary)' : '#4B5563',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM SECTION ────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 20px',
          textAlign: 'center',
          backgroundColor: isDark ? 'var(--bg-primary)' : '#F3F6FC',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '16px',
              color: isDark ? '#FFFFFF' : '#111827',
            }}
          >
            Ready to experience cinema?
          </h2>
          <p
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#4B5563',
              marginBottom: '32px',
              fontSize: '1.05rem',
              lineHeight: 1.6,
            }}
          >
            Join over 1 million movie enthusiasts booking smarter with instant seat confirmation.
          </p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{
              backgroundColor: 'var(--aurora-gradient)',
              color: '#FFFFFF',
              border: 'none',
              padding: '16px 44px',
              borderRadius: '9999px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 18px var(--primary-accent-glow)',
              transition: 'transform 0.2s',
            }}
          >
            Start Booking Now
          </button>
        </div>
      </section>

      {/* ── FOOTER STRIP & ADMIN LINK ──────────────────────────────── */}
      <footer
        style={{
          backgroundColor: isDark ? 'var(--bg-secondary)' : '#FFFFFF',
          borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#E5E7EB'}`,
          padding: '24px 20px',
          textAlign: 'center',
          color: isDark ? 'var(--text-muted)' : '#6B7280',
          fontSize: '0.86rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <FontAwesomeIcon icon={faFilm} style={{ marginRight: '8px', color: 'var(--primary-accent)' }} />
            © {new Date().getFullYear()} <strong style={{ color: isDark ? '#FFFFFF' : '#111827' }}>iMovies</strong>. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link
              to="/home"
              style={{
                color: isDark ? 'var(--text-secondary)' : '#4B5563',
                textDecoration: 'none',
              }}
            >
              Explore Movies
            </Link>

            <Link
              to="/login"
              style={{
                color: isDark ? 'var(--text-secondary)' : '#4B5563',
                textDecoration: 'none',
              }}
            >
              User Login
            </Link>

            <Link
              to="/admin-login"
              style={{
                color: isDark ? 'var(--text-secondary)' : '#4B5563',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
              title="Authorized Staff Portal"
            >
              <FontAwesomeIcon icon={faShieldAlt} style={{ color: 'var(--primary-accent)' }} />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
