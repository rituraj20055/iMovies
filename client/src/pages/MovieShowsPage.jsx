import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faMapMarkerAlt,
  faClock,
  faFilm,
  faTag,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const MovieShowsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate next 7 dates for date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().add(i, 'day');
    return {
      full: d.format('YYYY-MM-DD'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.format('ddd'),
      dayNumber: d.format('DD'),
      month: d.format('MMM'),
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].full);

  useEffect(() => {
    const fetchMovieAndShows = async () => {
      try {
        setLoading(true);
        const [movieRes, showsRes] = await Promise.all([
          api.get(`/api/movie/${movieId}`),
          api.get(`/api/shows/movie/${movieId}`, {
            params: { date: selectedDate },
          }),
        ]);

        setMovie(movieRes.data.movie || movieRes.data);
        setShows(showsRes.data.shows || showsRes.data || []);
      } catch (err) {
        console.error('Error fetching shows:', err);
        toast.error('Failed to load shows for this movie');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieAndShows();
  }, [movieId, selectedDate]);

  // Filter shows by selected date
  const filteredShows = shows.filter((s) => !selectedDate || s.showDate === selectedDate);

  // Group shows by Theatre
  const showsByTheatre = filteredShows.reduce((acc, show) => {
    const theatreKey = show.theatreName || show.theatreId || 'Cinema Hall';
    if (!acc[theatreKey]) {
      acc[theatreKey] = {
        theatreName: show.theatreName,
        theatreId: show.theatreId,
        shows: [],
      };
    }
    acc[theatreKey].shows.push(show);
    return acc;
  }, {});

  if (loading && !movie) return <Loader message="Loading available showtimes..." />;

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1 py-4">
        <div className="container">
          {/* Back button */}
          <div className="mb-3">
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

          {/* Movie Banner Strip */}
          {movie && (
            <div
              className="p-3 p-md-4 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <img
                  src={
                    movie.poster ||
                    movie.posterUrl ||
                    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={movie.movieName}
                  className="rounded-3 object-fit-cover shadow"
                  style={{ width: '65px', height: '90px' }}
                />
                <div>
                  <h3 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>{movie.movieName}</h3>
                  <div className="small mt-1 d-flex flex-wrap align-items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="badge-ott-red">{movie.language}</span>
                    <span>•</span>
                    <span>{movie.duration}</span>
                    <span>•</span>
                    <span>{Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/moviedetails/${movieId}`}
                className="btn-glass px-3 py-1.5 text-decoration-none"
                style={{ fontSize: '0.85rem' }}
              >
                Movie Overview
              </Link>
            </div>
          )}

          {/* Date Selector Row */}
          <div className="mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ color: 'var(--primary-red)' }} />
              <span>Select Date</span>
            </h5>
            <div className="d-flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {dates.map((d) => (
                <button
                  key={d.full}
                  type="button"
                  onClick={() => setSelectedDate(d.full)}
                  className={`btn p-3 rounded-4 d-flex flex-column align-items-center justify-content-center transition-all ${
                    selectedDate === d.full
                      ? 'btn-red shadow'
                      : 'btn-glass'
                  }`}
                  style={{
                    minWidth: '85px',
                  }}
                >
                  <span className="small fw-semibold text-uppercase" style={{ fontSize: '0.75rem' }}>
                    {d.dayName}
                  </span>
                  <span className="fs-4 fw-extrabold my-1">{d.dayNumber}</span>
                  <span className="small" style={{ fontSize: '0.75rem' }}>
                    {d.month}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Shows Grouped by Theatre */}
          <div className="d-flex flex-column gap-4">
            {Object.keys(showsByTheatre).length > 0 ? (
              Object.values(showsByTheatre).map((theatreGroup) => (
                <div
                  key={theatreGroup.theatreName}
                  className="p-4 rounded-4 shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {/* Theatre Header */}
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center pb-3 mb-3 border-bottom gap-2" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: 'rgba(229, 9, 20, 0.15)',
                          color: 'var(--primary-red)',
                        }}
                      >
                        <FontAwesomeIcon icon={faFilm} />
                      </div>
                      <div>
                        <h5 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>{theatreGroup.theatreName}</h5>
                        <div className="small d-flex align-items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: 'var(--primary-red)' }} />
                          <span>Main Cinema Complex</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 small" style={{ color: 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={faTag} />
                      <span>Instant Seat Locking Available</span>
                    </div>
                  </div>

                  {/* Show Timings Grid */}
                  <div className="d-flex flex-wrap gap-3">
                    {theatreGroup.shows.map((show) => {
                      const avail = show.availableSeats ?? 100;
                      return (
                        <div
                          key={show.showId || show._id}
                          className="d-flex flex-column align-items-center"
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/seatslug/${show.showId || show._id}`)}
                            className="btn btn-outline-danger px-4 py-2 rounded-3 fw-bold d-flex flex-column align-items-center transition-all"
                            style={{
                              borderColor: 'var(--primary-red)',
                              backgroundColor: 'rgba(229, 9, 20, 0.08)',
                              color: 'var(--text-primary)',
                              minWidth: '125px',
                            }}
                          >
                            <span className="fs-6">{show.showTime}</span>
                            <span
                              className={`badge mt-1 ${
                                avail > 20 ? 'bg-success' : avail > 0 ? 'bg-warning text-dark' : 'bg-secondary'
                              }`}
                              style={{ fontSize: '0.68rem' }}
                            >
                              {avail > 0 ? `${avail} seats left` : 'Sold Out'}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              /* No Shows Fallback */
              <div
                className="text-center py-5 rounded-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px dashed var(--border-color)',
                }}
              >
                <div className="mb-3" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Shows Scheduled</h4>
                <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                  There are no scheduled screenings for this movie on{' '}
                  <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                    {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
                  </span>
                  .
                </p>
                <p className="small" style={{ color: 'var(--text-muted)' }}>
                  Please pick another date from the calendar above or explore other movies.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MovieShowsPage;
