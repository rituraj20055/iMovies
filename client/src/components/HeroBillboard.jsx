import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt,
  faInfoCircle,
  faHeart,
  faStar,
  faChevronLeft,
  faChevronRight,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import api from '../utils/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const HeroBillboard = ({
  movies = [],
  userFavorites = new Set(),
  onFavoriteToggle,
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingFav, setLoadingFav] = useState(false);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex] || movies[0];
  const isFavorite = userFavorites.has(currentMovie._id);

  const backdropSrc =
    currentMovie.backdrop ||
    currentMovie.poster ||
    currentMovie.posterUrl ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

  const handleFavoriteClick = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      toast.info('Please log in to manage your watchlist');
      navigate('/login');
      return;
    }
    if (loadingFav) return;

    try {
      setLoadingFav(true);
      if (isFavorite) {
        await api.delete(`/api/favorite/${currentMovie._id}`);
        toast.info(`Removed "${currentMovie.movieName}" from watchlist`);
        if (onFavoriteToggle) onFavoriteToggle(currentMovie._id, false);
      } else {
        await api.post('/api/favorite', { movieId: currentMovie._id });
        toast.success(`Added "${currentMovie.movieName}" to watchlist ❤️`);
        if (onFavoriteToggle) onFavoriteToggle(currentMovie._id, true);
      }
    } catch (err) {
      toast.error('Could not update watchlist');
    } finally {
      setLoadingFav(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const releaseYear = currentMovie.releaseDate
    ? dayjs(currentMovie.releaseDate).format('YYYY')
    : '2026';

  const ratingScore = currentMovie.rating
    ? Number(currentMovie.rating).toFixed(1)
    : '8.5';

  return (
    <div
      className="ott-hero-billboard"
      style={{
        backgroundImage: `url(${backdropSrc})`,
      }}
    >
      {/* Cinematic Dual Gradient Overlays */}
      <div className="ott-hero-gradient-overlay" />

      <div className="container position-relative" style={{ zIndex: 3 }}>
        <div className="row">
          <div className="col-12 col-md-9 col-lg-7 col-xl-6 ott-hero-content">
            {/* Badges Row - Midnight Aurora */}
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <span className="badge-ott-cyan text-uppercase px-3 py-1">
                Spotlight Premiere
              </span>
              <div className="badge-ott-gold d-flex align-items-center gap-1 px-2.5 py-1">
                <FontAwesomeIcon icon={faStar} />
                <span>{ratingScore} Rating</span>
              </div>
              <span className="badge-ott px-2.5 py-1">
                {currentMovie.certification || 'U/A'}
              </span>
              <span className="badge-ott px-2.5 py-1">
                {releaseYear}
              </span>
              {currentMovie.duration && (
                <span className="badge-ott px-2.5 py-1 d-flex align-items-center gap-1">
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.7rem' }} />
                  {currentMovie.duration}
                </span>
              )}
            </div>

            {/* Movie Title */}
            <h1
              className="display-4 fw-extrabold mb-2"
              style={{
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: 'var(--text-primary)',
              }}
            >
              {currentMovie.movieName}
            </h1>

            {/* Genres & Language Info */}
            <div className="d-flex align-items-center gap-2 mb-3 small fw-semibold" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--primary-accent)' }}>
                {currentMovie.language || 'English'}
              </span>
              <span>•</span>
              <span>
                {Array.isArray(currentMovie.genres)
                  ? currentMovie.genres.join(', ')
                  : currentMovie.genres}
              </span>
            </div>

            {/* Synopsis */}
            <p
              className="line-clamp-3 mb-4"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.98rem',
                lineHeight: 1.6,
                maxWidth: '560px',
              }}
            >
              {currentMovie.description}
            </p>

            {/* Actions */}
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <Link
                to={`/movieshows/${currentMovie._id}`}
                className="btn-aurora px-4 py-2.5 text-decoration-none shadow-lg"
                style={{ fontSize: '1rem', fontWeight: 700 }}
              >
                <FontAwesomeIcon icon={faTicketAlt} />
                <span>Book Tickets</span>
              </Link>

              <Link
                to={`/moviedetails/${currentMovie._id}`}
                className="btn-glass px-4 py-2.5 text-decoration-none"
                style={{ fontSize: '1rem' }}
              >
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>View Details</span>
              </Link>

              <button
                type="button"
                onClick={handleFavoriteClick}
                disabled={loadingFav}
                className="btn-glass p-2.5 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '46px',
                  height: '46px',
                  color: isFavorite ? 'var(--secondary-accent)' : 'var(--text-primary)',
                }}
                title={isFavorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
                aria-label={isFavorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <FontAwesomeIcon icon={isFavorite ? faHeart : faHeartRegular} className="fs-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation if multiple featured movies */}
      {movies.length > 1 && (
        <div
          className="position-absolute bottom-0 end-0 m-4 d-flex align-items-center gap-2"
          style={{ zIndex: 4 }}
        >
          <button
            type="button"
            className="btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={prevSlide}
            aria-label="Previous Featured Movie"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          <span className="small fw-bold px-1" style={{ color: 'var(--text-secondary)' }}>
            {currentIndex + 1} / {movies.length}
          </span>

          <button
            type="button"
            className="btn-glass p-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={nextSlide}
            aria-label="Next Featured Movie"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroBillboard;
