import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import MovieCard from './MovieCard';

const MovieRow = ({
  title,
  icon,
  badgeText,
  movies = [],
  userFavorites = new Set(),
  onFavoriteToggle,
}) => {
  const rowRef = useRef(null);

  if (!movies || movies.length === 0) return null;

  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="movie-row-container">
      {/* Header */}
      <div className="movie-row-header">
        <div className="movie-row-title-wrapper">
          <div className="movie-row-indicator" />
          {icon && (
            <span style={{ color: 'var(--primary-accent)', fontSize: '1.1rem' }}>
              <FontAwesomeIcon icon={icon} />
            </span>
          )}
          <h2 className="movie-row-title">{title}</h2>
          {badgeText && (
            <span className="badge-ott-cyan ms-2 d-none d-sm-inline-block">
              {badgeText}
            </span>
          )}
        </div>

        <div className="text-secondary small fw-semibold">
          {movies.length} {movies.length === 1 ? 'Title' : 'Titles'}
        </div>
      </div>

      {/* Horizontal Carousel with Arrows */}
      <div className="position-relative">
        <button
          type="button"
          className="movie-row-arrow left"
          onClick={() => scroll('left')}
          aria-label={`Scroll ${title} left`}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="movie-row-scroll" ref={rowRef}>
          {movies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              layout="row"
              isFavorite={userFavorites.has(movie._id)}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>

        <button
          type="button"
          className="movie-row-arrow right"
          onClick={() => scroll('right')}
          aria-label={`Scroll ${title} right`}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
};

export default MovieRow;
