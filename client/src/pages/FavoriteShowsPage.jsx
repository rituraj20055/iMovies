import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import MovieCard from '../components/MovieCard';
import api from '../utils/api';
import { deduplicateMovies } from '../utils/movieUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faFilm } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const FavoriteShowsPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/favorite');
      const favList = res.data.favorites || res.data || [];
      const movies = favList
        .map((f) => f.movieId)
        .filter((m) => m && typeof m === 'object');
      setFavorites(deduplicateMovies(movies));
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      toast.error('Could not load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleFavoriteToggle = (movieId, isFav) => {
    if (!isFav) {
      setFavorites((prev) => prev.filter((m) => m._id !== movieId));
    }
  };

  if (loading) return <Loader message="Loading your watchlist..." />;

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1 py-5">
        <div className="container">
          {/* Header */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-1">
              <div className="movie-row-indicator" />
              <h2 className="fw-extrabold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FontAwesomeIcon icon={faHeart} style={{ color: 'var(--secondary-accent)' }} />
                <span>My Watchlist</span>
              </h2>
            </div>
            <p className="small mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your saved blockbusters and favorite movies ready for booking anytime.
            </p>
          </div>

          {/* Grid */}
          {favorites.length > 0 ? (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
              {favorites.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  layout="grid"
                  isFavorite={true}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              className="text-center py-5 rounded-4 my-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <div className="mb-3" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>
                <FontAwesomeIcon icon={faFilm} />
              </div>
              <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your Watchlist is Empty</h4>
              <p className="mb-4 mx-auto" style={{ maxWidth: '400px', color: 'var(--text-secondary)' }}>
                Explore the latest movies and tap the heart icon on any poster to save it to your personal watchlist.
              </p>
              <Link to="/home" className="btn-cyan px-4 py-2 text-decoration-none">
                Browse Movies
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FavoriteShowsPage;
