import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faClock,
  faCalendarAlt,
  faLanguage,
  faTicketAlt,
  faHeart,
  faPlay,
  faTrash,
  faUser,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const currentUserEmail = localStorage.getItem('userEmail');
  const userToken = localStorage.getItem('userToken');

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const [movieRes, reviewsRes, ratingRes, favRes] = await Promise.allSettled([
          api.get(`/api/movie/${movieId}`),
          api.get(`/api/review/movie/${movieId}`),
          api.get(`/api/review/movie/${movieId}/rating`),
          userToken ? api.get(`/api/favorite/check/${movieId}`) : Promise.resolve({ data: { isFavorite: false } }),
        ]);

        if (movieRes.status === 'fulfilled') {
          setMovie(movieRes.value.data.movie || movieRes.value.data);
        } else {
          toast.error('Movie not found');
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value.data.reviews || reviewsRes.value.data || []);
        }

        if (ratingRes.status === 'fulfilled') {
          setRatingStats(ratingRes.value.data);
        }

        if (favRes.status === 'fulfilled') {
          setIsFavorite(favRes.value.data?.isFavorite || false);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId, userToken]);

  const handleToggleFavorite = async () => {
    if (!userToken) {
      toast.info('Please log in to manage your watchlist');
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/api/favorite/${movieId}`);
        setIsFavorite(false);
        toast.info('Removed from watchlist');
      } else {
        await api.post('/api/favorite', { movieId });
        setIsFavorite(true);
        toast.success('Added to watchlist ❤️');
      }
    } catch (err) {
      toast.error('Could not update watchlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userToken) {
      toast.info('Please log in to submit a review');
      navigate('/login');
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      toast.warning('Review must be at least 10 characters long');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post('/api/review', {
        movieId,
        rating: Number(newRating),
        reviewText: reviewText.trim(),
      });

      toast.success('Review submitted successfully! ⭐');
      setReviewText('');

      const [newReviewsRes, newRatingRes] = await Promise.all([
        api.get(`/api/review/movie/${movieId}`),
        api.get(`/api/review/movie/${movieId}/rating`),
      ]);
      setReviews(newReviewsRes.data.reviews || newReviewsRes.data || []);
      setRatingStats(newRatingRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await api.delete(`/api/review/${reviewId}`);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));

      const ratingRes = await api.get(`/api/review/movie/${movieId}/rating`);
      setRatingStats(ratingRes.data);
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) return <Loader message="Loading cinematic details..." />;

  if (!movie) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Header />
        <div className="container text-center my-auto py-5">
          <h2 style={{ color: 'var(--text-primary)' }}>Movie Not Found</h2>
          <Link to="/home" className="btn-red mt-3">
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const posterImg =
    movie.poster ||
    movie.posterUrl ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

  const backdropImg = movie.backdrop || posterImg;

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1">
        {/* Backdrop & Hero Section */}
        <section
          className="position-relative py-5"
          style={{
            backgroundImage: `url(${backdropImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Dual Theme-Aware Gradient Overlay */}
          <div className="ott-hero-gradient-overlay" />

          <div className="container py-4 position-relative" style={{ zIndex: 3 }}>
            {/* Back Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-glass px-3 py-1.5"
                style={{ fontSize: '0.85rem' }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back</span>
              </button>
            </div>

            <div className="row g-4 align-items-center">
              {/* Poster Column */}
              <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
                <div
                  className="rounded-4 overflow-hidden mx-auto shadow-lg"
                  style={{
                    maxWidth: '300px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <img src={posterImg} alt={movie.movieName} className="w-100 object-fit-cover" />
                </div>
              </div>

              {/* Movie Details Column */}
              <div className="col-12 col-md-8 col-lg-9">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  {movie.certification && (
                    <span className="badge-ott-red fw-bold">
                      {movie.certification}
                    </span>
                  )}
                  {Array.isArray(movie.genres) &&
                    movie.genres.map((g) => (
                      <span key={g} className="badge-ott">
                        {g}
                      </span>
                    ))}
                </div>

                <h1
                  className="display-4 fw-extrabold mb-2"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  {movie.movieName}
                </h1>

                {/* Rating & Meta info */}
                <div className="d-flex flex-wrap align-items-center gap-3 mb-4 small" style={{ color: 'var(--text-secondary)' }}>
                  <div className="badge-ott-gold d-flex align-items-center gap-1.5 px-2.5 py-1">
                    <FontAwesomeIcon icon={faStar} />
                    <span className="fw-bold">{ratingStats.averageRating ? Number(ratingStats.averageRating).toFixed(1) : (movie.rating ? Number(movie.rating).toFixed(1) : '8.5')}</span>
                    <span className="fw-normal" style={{ fontSize: '0.72rem' }}>
                      ({ratingStats.totalReviews || reviews.length} reviews)
                    </span>
                  </div>
                  <span>•</span>
                  <div className="d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faClock} style={{ color: 'var(--primary-red)' }} />
                    <span>{movie.duration}</span>
                  </div>
                  <span>•</span>
                  <div className="d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faLanguage} style={{ color: 'var(--primary-red)' }} />
                    <span>{movie.language}</span>
                  </div>
                  <span>•</span>
                  <div className="d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ color: 'var(--primary-red)' }} />
                    <span>{dayjs(movie.releaseDate).format('MMM D, YYYY')}</span>
                  </div>
                </div>

                {/* Director & Cast */}
                <div className="mb-4 small">
                  {movie.director && (
                    <div className="mb-1.5">
                      <span className="fw-semibold" style={{ color: 'var(--text-muted)' }}>Director: </span>
                      <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>{movie.director}</span>
                    </div>
                  )}
                  {movie.cast && movie.cast.length > 0 && (
                    <div>
                      <span className="fw-semibold" style={{ color: 'var(--text-muted)' }}>Cast: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p
                  className="mb-4 pe-lg-5"
                  style={{ fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}
                >
                  {movie.description}
                </p>

                {/* CTAs */}
                <div className="d-flex flex-wrap gap-3">
                  <Link
                    to={`/movieshows/${movie._id}`}
                    className="btn-red px-4 py-2.5 shadow-lg text-decoration-none"
                    style={{ fontSize: '1rem', fontWeight: 700 }}
                  >
                    <FontAwesomeIcon icon={faTicketAlt} />
                    <span>Book Tickets</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`px-4 py-2.5 rounded-pill fw-semibold d-flex align-items-center gap-2 ${
                      isFavorite ? 'btn-red' : 'btn-glass'
                    }`}
                  >
                    <FontAwesomeIcon icon={isFavorite ? faHeart : faHeartRegular} />
                    <span>{isFavorite ? 'In Watchlist' : 'Add to Watchlist'}</span>
                  </button>

                  {movie.trailer && (
                    <a
                      href={movie.trailer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-glass px-4 py-2.5 text-decoration-none"
                    >
                      <FontAwesomeIcon icon={faPlay} />
                      <span>Watch Trailer</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <div className="container py-5">
          <div className="row g-4">
            {/* Reviews List */}
            <div className="col-12 col-lg-7">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="movie-row-indicator" />
                  <h3 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>
                    Audience Reviews
                  </h3>
                </div>
                <span className="badge-ott px-3 py-1">
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>

              {reviews.length === 0 ? (
                <div
                  className="p-4 rounded-4 text-center"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                    No reviews yet. Be the first to share your thoughts on this blockbuster!
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-3 p-md-4 rounded-4"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '36px',
                              height: '36px',
                              background: 'var(--aurora-gradient)',
                              fontSize: '0.85rem',
                            }}
                          >
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                          <div>
                            <div className="fw-bold small" style={{ color: 'var(--text-primary)' }}>
                              {rev.username || rev.userEmail?.split('@')[0]}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {dayjs(rev.createdAt).format('MMMM D, YYYY')}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          <div className="badge-ott-gold d-flex align-items-center gap-1 small py-1 px-2.5">
                            <FontAwesomeIcon icon={faStar} />
                            <span>{rev.rating} / 5</span>
                          </div>
                          {currentUserEmail && rev.userEmail === currentUserEmail && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev._id)}
                              className="btn btn-sm btn-outline-danger p-1 rounded-circle"
                              title="Delete Review"
                              aria-label="Delete Review"
                            >
                              <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.75rem' }} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="m-0" style={{ fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        {rev.reviewText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Box */}
            <div className="col-12 col-lg-5">
              <div
                className="p-4 rounded-4 sticky-top"
                style={{
                  top: '90px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h4 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Write a Review
                </h4>
                <form onSubmit={handleReviewSubmit}>
                  {/* Rating selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="d-flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="btn btn-sm p-2 rounded-3 border-0 transition-all"
                          style={{
                            color: star <= newRating ? '#ffc107' : 'var(--text-muted)',
                            backgroundColor: 'var(--bg-surface)',
                            fontSize: '1.3rem',
                          }}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Your Review
                    </label>
                    <textarea
                      rows={4}
                      className="form-control form-control-dark"
                      placeholder="Share what you loved about this movie..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                      minLength={10}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-red w-100 py-2.5"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MovieDetailsPage;
