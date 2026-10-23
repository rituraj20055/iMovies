import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faTicketAlt,
  faStar,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faPlay,
  faBolt,
  faCouch,
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import { deduplicateMovies } from '../utils/movieUtils';

/* ─────────────────────────────────────────────
   Inline styles (cinema dark theme)
───────────────────────────────────────────── */
const styles = {
  /* ── Root ── */
  root: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: '#0a0a0a',
    color: '#fff',
    minHeight: '100vh',
    overflowX: 'hidden',
  },

  /* ── Hero ── */
  hero: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse at 20% 50%, rgba(54, 217, 255, 0.15) 0%, transparent 60%),' +
      'radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),' +
      'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-card) 100%)',
    zIndex: 0,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '0 20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroLogo: {
    fontSize: '1rem',
    letterSpacing: '0.4em',
    color: 'var(--primary-accent)',
    textTransform: 'uppercase',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
    fontWeight: 900,
    lineHeight: 1.1,
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #fff 40%, var(--primary-accent) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '48px',
    lineHeight: 1.6,
    maxWidth: '600px',
    margin: '0 auto 48px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    background: 'var(--aurora-gradient)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 15px var(--primary-accent-glow)',
    padding: '14px 36px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.05em',
  },
  btnOutline: {
    background: 'transparent',
    color: '#fff',
    border: '2px solid rgba(255,255,255,0.6)',
    padding: '14px 36px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.05em',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    animation: 'bounce 2s infinite',
  },

  /* ── Stats Bar ── */
  statsBar: {
    background: 'linear-gradient(90deg, #141414, #1a1a1a, #141414)',
    borderTop: '1px solid rgba(229,9,20,0.3)',
    borderBottom: '1px solid rgba(229,9,20,0.3)',
    padding: '24px 20px',
  },
  statsInner: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 900,
    color: 'var(--primary-accent)',
    display: 'block',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },

  /* ── Section ── */
  section: {
    padding: '80px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  redLine: {
    flex: 1,
    height: '2px',
    background: 'var(--aurora-gradient)',
    borderRadius: '2px',
  },

  /* ── Carousel ── */
  carouselWrap: {
    position: 'relative',
  },
  carouselTrack: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    paddingBottom: '12px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  movieCard: {
    flexShrink: 0,
    width: '180px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#141414',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  moviePoster: {
    width: '100%',
    height: '260px',
    objectFit: 'cover',
    display: 'block',
    background: '#1e1e1e',
  },
  movieCardBody: {
    padding: '10px',
  },
  movieCardTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  movieCardGenre: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.45)',
  },
  carouselBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(229,9,20,0.85)',
    border: 'none',
    color: '#fff',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    fontSize: '0.9rem',
  },
  posterSkeleton: {
    width: '180px',
    height: '310px',
    borderRadius: '12px',
    background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)',
    flexShrink: 0,
    animation: 'shimmer 1.5s infinite',
  },

  /* ── Features ── */
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    background: '#141414',
    border: '1px solid rgba(229,9,20,0.2)',
    borderRadius: '16px',
    padding: '32px 24px',
    textAlign: 'center',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  featureIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(54, 217, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '1.5rem',
    color: 'var(--primary-accent)',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '10px',
    color: '#fff',
  },
  featureDesc: {
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.6,
  },

  /* ── Footer strip ── */
  footerStrip: {
    background: '#0d0d0d',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '24px 20px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.82rem',
  },
};

/* Feature cards data */
const FEATURES = [
  {
    icon: faBolt,
    title: 'Real-time Booking',
    desc: 'Live seat availability updates powered by WebSocket technology. No more double bookings.',
  },
  {
    icon: faCheckCircle,
    title: 'Instant Confirmation',
    desc: 'Receive your booking confirmation and e-ticket instantly after payment.',
  },
  {
    icon: faCouch,
    title: 'Best Seats',
    desc: 'Interactive seat maps across Balcony, Middle, and Lower tiers so you always get the perfect view.',
  },
];

/* Stats data */
const STATS = [
  { number: '500+', label: 'Movies' },
  { number: '100+', label: 'Theatres' },
  { number: '1M+', label: 'Happy Customers' },
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();
  const trackRef = useRef(null);

  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

  /* Hover states */
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredPrimary, setHoveredPrimary] = useState(false);
  const [hoveredOutline, setHoveredOutline] = useState(false);

  /* Fetch featured movies */
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/movie/featured');
        setFeaturedMovies(deduplicateMovies(res.data?.movies || res.data || []));
      } catch {
        setFeaturedMovies([]);
      } finally {
        setLoadingMovies(false);
      }
    };
    fetchFeatured();
  }, []);

  /* Carousel scroll */
  const scrollCarousel = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  /* Inject keyframe animations once */
  useEffect(() => {
    const id = 'imovies-landing-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-10px); }
      }
      @keyframes shimmer {
        0% { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .imovies-carousel::-webkit-scrollbar { display: none; }
      .imovies-movie-card:hover { transform: scale(1.05); box-shadow: 0 8px 32px rgba(229,9,20,0.3); }
      .imovies-feature-card:hover { border-color: rgba(229,9,20,0.5); transform: translateY(-4px); }
      .imovies-particle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.07;
        animation: float linear infinite;
      }
      @keyframes float {
        0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
        10% { opacity: 0.07; }
        90% { opacity: 0.07; }
        100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* Particle definitions */
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 80 + 20,
    left: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * -20,
    color: i % 3 === 0 ? 'var(--primary-accent)' : i % 3 === 1 ? 'var(--secondary-accent)' : '#fff',
  }));

  return (
    <div style={styles.root}>
      {/* ── HERO ─────────────────────────────── */}
      <section style={styles.hero}>
        {/* Animated background */}
        <div style={styles.heroBg} />

        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="imovies-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        <div style={styles.heroContent}>
          {/* Brand pill */}
          <div style={styles.heroLogo}>
            <FontAwesomeIcon icon={faFilm} />
            <span>iMovies</span>
          </div>

          <h1 style={styles.heroTitle}>Welcome to iMovies</h1>

          <p style={styles.heroSubtitle}>
            Your ultimate destination for the latest blockbusters and timeless classics.
            Book your perfect seat in seconds.
          </p>

          <div style={styles.ctaGroup}>
            <button
              style={{
                ...styles.btnOutline,
                ...(hoveredOutline
                  ? { background: 'rgba(255,255,255,0.1)', borderColor: '#fff' }
                  : {}),
              }}
              onMouseEnter={() => setHoveredOutline(true)}
              onMouseLeave={() => setHoveredOutline(false)}
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              style={{
                ...styles.btnPrimary,
                ...(hoveredPrimary
                  ? { background: '#c40812', borderColor: '#c40812', transform: 'scale(1.03)' }
                  : {}),
              }}
              onMouseEnter={() => setHoveredPrimary(true)}
              onMouseLeave={() => setHoveredPrimary(false)}
              onClick={() => navigate('/register')}
            >
              Sign Up — It's Free
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={styles.scrollIndicator}>
          <span>SCROLL</span>
          <FontAwesomeIcon icon={faChevronLeft} style={{ transform: 'rotate(-90deg)', fontSize: '1rem' }} />
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────── */}
      <div style={styles.statsBar}>
        <div style={styles.statsInner}>
          {STATS.map((s) => (
            <div key={s.label} style={styles.statItem}>
              <span style={styles.statNumber}>{s.number}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED MOVIES CAROUSEL ─────────── */}
      <div style={{ ...styles.section, maxWidth: '1300px' }}>
        <div style={styles.sectionHeader}>
          <FontAwesomeIcon icon={faStar} style={{ color: 'var(--primary-accent)', fontSize: '1.3rem' }} />
          <h2 style={styles.sectionTitle}>Featured Movies</h2>
          <div style={styles.redLine} />
        </div>

        <div style={styles.carouselWrap}>
          {/* Prev */}
          <button
            style={{ ...styles.carouselBtn, left: '-20px' }}
            onClick={() => scrollCarousel(-1)}
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            style={styles.carouselTrack}
            className="imovies-carousel"
          >
            {loadingMovies
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={styles.posterSkeleton} />
                ))
              : featuredMovies.length > 0
              ? featuredMovies.map((movie) => {
                  const title = movie.movieName || movie.title || 'Featured Movie';
                  const poster = movie.poster || movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
                  return (
                    <div
                      key={movie._id}
                      style={styles.movieCard}
                      className="imovies-movie-card"
                      onClick={() => navigate(`/moviedetails/${movie._id}`)}
                      onMouseEnter={() => setHoveredCard(movie._id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <img
                        src={poster}
                        alt={title}
                        style={styles.moviePoster}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div style={styles.movieCardBody}>
                        <div style={styles.movieCardTitle}>{title}</div>
                        <div style={styles.movieCardGenre}>
                          {Array.isArray(movie.genres)
                            ? movie.genres.join(', ')
                            : movie.genres || movie.genre || 'Cinema'}
                        </div>
                      </div>
                    </div>
                  );
                })
              : (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    No featured movies available right now.
                  </p>
                )}
          </div>

          {/* Next */}
          <button
            style={{ ...styles.carouselBtn, right: '-20px' }}
            onClick={() => scrollCarousel(1)}
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────── */}
      <div style={{ background: '#0d0d0d', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ ...styles.sectionHeader, marginBottom: '48px' }}>
            <FontAwesomeIcon icon={faPlay} style={{ color: 'var(--primary-accent)', fontSize: '1.3rem' }} />
            <h2 style={styles.sectionTitle}>Why Choose iMovies?</h2>
            <div style={styles.redLine} />
          </div>

          <div style={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} style={styles.featureCard} className="imovies-feature-card">
                <div style={styles.featureIcon}>
                  <FontAwesomeIcon icon={f.icon} />
                </div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BOTTOM ───────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0a0a, #0a0a0a)',
          borderTop: '1px solid rgba(229,9,20,0.2)',
          padding: '80px 20px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>
          Ready to experience cinema?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
          Join over 1 million movie lovers. Sign up free today.
        </p>
        <button
          style={{
            ...styles.btnPrimary,
            fontSize: '1.1rem',
            padding: '16px 48px',
          }}
          onClick={() => navigate('/register')}
        >
          Get Started
        </button>
      </div>

      {/* ── FOOTER STRIP ─────────────────────── */}
      <div style={styles.footerStrip}>
        <FontAwesomeIcon icon={faFilm} style={{ marginRight: '8px', color: 'var(--primary-accent)' }} />
        © {new Date().getFullYear()} iMovies. All rights reserved.
      </div>
    </div>
  );
};

export default LandingPage;
