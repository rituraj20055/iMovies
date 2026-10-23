import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHeart, faClock, faTicketAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import api from '../utils/api';
import { toast } from 'react-toastify';

const MovieCard = ({
  movie,
  isFavorite: initialFavorite = false,
  onFavoriteToggle,
  layout = 'grid', // 'grid' | 'row'
}) => {
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [loadingFav, setLoadingFav] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync if initialFavorite prop changes
  React.useEffect(() => {
    setFavorite(initialFavorite);
  }, [initialFavorite]);

  const posterSrc = !imgError && (movie?.poster || movie?.posterUrl)
    ? (movie.poster || movie.posterUrl)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingFav) return;

    const token = localStorage.getItem('userToken');
    if (!token) {
      toast.info('Please log in to manage your watchlist');
      navigate('/login');
      return;
    }

    try {
      setLoadingFav(true);
      if (favorite) {
        await api.delete(`/api/favorite/${movie._id}`);
        setFavorite(false);
        toast.info(`Removed "${movie.movieName}" from watchlist`);
        if (onFavoriteToggle) onFavoriteToggle(movie._id, false);
      } else {
        await api.post('/api/favorite', { movieId: movie._id });
        setFavorite(true);
        toast.success(`Added "${movie.movieName}" to watchlist ❤️`);
        if (onFavoriteToggle) onFavoriteToggle(movie._id, true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update watchlist');
    } finally {
      setLoadingFav(false);
    }
  };

  const formattedRating = movie?.rating
    ? Number(movie.rating).toFixed(1)
    : '8.4';

  const genresList = Array.isArray(movie?.genres)
    ? movie.genres.slice(0, 2).join(' • ')
    : (movie?.genres || 'Action');

  const cardContent = (
    <div
      className={`ott-movie-card ${layout === 'grid' ? 'w-100' : ''}`}
      style={{
        width: layout === 'grid' ? '100%' : '220px',
        flex: layout === 'grid' ? 'none' : '0 0 220px',
      }}
    >
      {/* Poster Box */}
      <div
        className="ott-movie-card__poster-box"
        onClick={() => navigate(`/moviedetails/${movie._id}`)}
      >
        <img
          src={posterSrc}
          alt={movie.movieName}
          className="ott-movie-card__poster"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {/* Gradient Overlay */}
        <div className="ott-movie-card__overlay" />

        {/* Certification Badge */}
        {movie.certification && (
          <span
            className="position-absolute top-0 start-0 m-2.5 badge-ott fw-bold"
            style={{ fontSize: '0.7rem' }}
          >
            {movie.certification}
          </span>
        )}

        {/* Watchlist Favorite Toggle */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={loadingFav}
          className="position-absolute top-0 end-0 m-2.5 btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
          style={{
            width: '34px',
            height: '34px',
            backgroundColor: 'rgba(10, 11, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-color)',
            color: favorite ? 'var(--secondary-accent)' : 'var(--text-secondary)',
            boxShadow: favorite ? '0 0 12px var(--secondary-accent-glow)' : 'none',
            transition: 'transform 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
            zIndex: 3,
          }}
          title={favorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
          aria-label={favorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <FontAwesomeIcon icon={favorite ? faHeart : faHeartRegular} />
        </button>

        {/* Rating and Duration on Poster Bottom */}
        <div className="position-absolute bottom-0 start-0 w-100 p-2.5 d-flex align-items-center justify-content-between" style={{ zIndex: 2 }}>
          <div className="d-flex align-items-center gap-1.5 badge-ott-gold py-1 px-2">
            <FontAwesomeIcon icon={faStar} style={{ fontSize: '0.75rem' }} />
            <span style={{ fontSize: '0.75rem' }}>{formattedRating}</span>
          </div>

          {movie.duration && (
            <span className="badge-ott py-1 px-2 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
              <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.65rem' }} />
              <span>{movie.duration}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="ott-movie-card__body">
        <Link
          to={`/moviedetails/${movie._id}`}
          className="ott-movie-card__title"
          title={movie.movieName}
        >
          {movie.movieName}
        </Link>

        <div className="ott-movie-card__genres" title={genresList}>
          {genresList}
        </div>

        {/* Card Action Buttons */}
        <div className="ott-movie-card__footer">
          <Link
            to={`/moviedetails/${movie._id}`}
            className="btn btn-sm btn-glass px-2.5 py-1 text-decoration-none"
            style={{ fontSize: '0.75rem', borderRadius: '8px' }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faInfoCircle} />
            <span className="d-none d-sm-inline">Info</span>
          </Link>

          <Link
            to={`/movieshows/${movie._id}`}
            className="btn btn-sm btn-cyan px-3 py-1 text-decoration-none"
            style={{ fontSize: '0.78rem', borderRadius: '8px' }}
            title="Book Tickets"
          >
            <FontAwesomeIcon icon={faTicketAlt} />
            <span>Book</span>
          </Link>
        </div>
      </div>
    </div>
  );

  if (layout === 'grid') {
    return <div className="col">{cardContent}</div>;
  }

  return cardContent;
};

export default MovieCard;
