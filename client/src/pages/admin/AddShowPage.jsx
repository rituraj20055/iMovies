import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarPlus,
  faFilm,
  faBuilding,
  faClock,
  faTrash,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const PRESET_TIMES = [
  '09:30 AM',
  '12:45 PM',
  '04:15 PM',
  '07:30 PM',
  '10:45 PM',
];

const AddShowPage = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [showDate, setShowDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showTime, setShowTime] = useState('07:30 PM');
  const [ticketPrice, setTicketPrice] = useState(250);

  const fetchDependencies = async () => {
    try {
      setLoading(true);
      const [moviesRes, theatresRes, showsRes] = await Promise.allSettled([
        api.get('/api/movie'),
        api.get('/api/theatre'),
        api.get('/api/shows'),
      ]);

      if (moviesRes.status === 'fulfilled') {
        const mList = moviesRes.value.data.movies || moviesRes.value.data || [];
        setMovies(mList);
        if (mList.length > 0 && !selectedMovieId) setSelectedMovieId(mList[0]._id);
      }

      if (theatresRes.status === 'fulfilled') {
        const tList = theatresRes.value.data.theatres || theatresRes.value.data || [];
        setTheatres(tList);
        if (tList.length > 0 && !selectedTheatreId) setSelectedTheatreId(tList[0].theatreId);
      }

      if (showsRes.status === 'fulfilled') {
        setShows(showsRes.value.data.shows || showsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMovieId || !selectedTheatreId || !showDate || !showTime) {
      toast.warning('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const selectedMovie = movies.find((m) => String(m._id) === String(selectedMovieId));
      const selectedTheatre = theatres.find((t) => String(t.theatreId) === String(selectedTheatreId));

      const payload = {
        movieId: selectedMovieId,
        movieName: selectedMovie?.movieName || selectedMovie?.name || 'Movie Screening',
        theatreId: selectedTheatreId,
        theatreName: selectedTheatre?.theatreName || selectedTheatre?.name || 'Cinema',
        showDate,
        showTime,
        ticketPrice: Number(ticketPrice),
        adminEmail: localStorage.getItem('adminEmail') || 'admin@imovies.com',
      };

      await api.post('/api/shows', payload);
      toast.success('Show scheduled successfully! 🎬');
      fetchDependencies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this show?')) return;
    try {
      await api.delete(`/api/shows/${showId}`);
      toast.success('Show deleted');
      fetchDependencies();
    } catch (err) {
      toast.error('Failed to delete show');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeRoute="shows" />

      <main className="admin-main">
        <div className="container-fluid py-2">
          {/* Header */}
          <div className="admin-page-header mb-4">
            <div>
              <h1 className="admin-page-title d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faCalendarPlus} style={{ color: 'var(--primary-accent)' }} />
                <span>Show Scheduling</span>
              </h1>
              <p className="admin-page-subtitle">
                Assign movies to theatres, select dates & times, and initialize live seat maps.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Form */}
            <div className="col-12 col-xl-5">
              <div
                className="p-4 rounded-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h4 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Schedule New Show</h4>

                <form onSubmit={handleSubmit}>
                  {/* Select Movie */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Select Movie</label>
                    <select
                      className="form-select"
                      value={selectedMovieId}
                      onChange={(e) => setSelectedMovieId(e.target.value)}
                      required
                    >
                      {movies.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.movieName || m.name} ({m.language || 'English'})
                        </option>
                      ))}
                    </select>
                    {movies.length === 0 && (
                      <span className="text-danger small mt-1 d-block">
                        Please add movies first from the Movies panel.
                      </span>
                    )}
                  </div>

                  {/* Select Theatre */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Select Theatre</label>
                    <select
                      className="form-select"
                      value={selectedTheatreId}
                      onChange={(e) => setSelectedTheatreId(e.target.value)}
                      required
                    >
                      {theatres.map((t) => (
                        <option key={t.theatreId} value={t.theatreId}>
                          {t.theatreName || t.name} — {t.location}
                        </option>
                      ))}
                    </select>
                    {theatres.length === 0 && (
                      <span className="text-danger small mt-1 d-block">
                        Please register theatres first in Theatre Management.
                      </span>
                    )}
                  </div>

                  {/* Show Date */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Screening Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={showDate}
                      min={dayjs().format('YYYY-MM-DD')}
                      onChange={(e) => setShowDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Show Time */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Screening Time</label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      value={showTime}
                      onChange={(e) => setShowTime(e.target.value)}
                      placeholder="e.g. 07:30 PM"
                      required
                    />
                    <div className="d-flex flex-wrap gap-1">
                      {PRESET_TIMES.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setShowTime(time)}
                          className={`btn btn-sm rounded-pill px-2.5 py-0.5 text-nowrap ${
                            showTime === time ? 'btn-danger' : 'btn-outline-secondary'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || movies.length === 0 || theatres.length === 0}
                    className="btn btn-aurora w-100 rounded-pill py-2.5 fw-bold mt-3"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Show'}
                  </button>
                </form>
              </div>
            </div>

            {/* Existing Shows List */}
            <div className="col-12 col-xl-7">
              <div
                className="p-4 rounded-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>Scheduled Shows</h4>
                  <span className="badge bg-secondary rounded-pill px-3 py-1.5">
                    {shows.length} Total
                  </span>
                </div>

                {loading ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading shows...</p>
                ) : shows.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {shows.map((s) => (
                      <div
                        key={s.showId || s._id}
                        className="p-3 rounded-3"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>
                              {s.movieName ||
                               movies.find((m) => String(m._id) === String(s.movieId))?.movieName ||
                               movies.find((m) => String(m._id) === String(s.movieId))?.name ||
                               s.movieId?.movieName ||
                               'Movie Screening'}
                            </h5>
                            <div className="small mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {s.theatreName || s.theatreId}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteShow(s.showId)}
                            className="btn btn-sm btn-outline-danger p-1.5 rounded-circle"
                            title="Delete Show"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>

                        <div className="d-flex flex-wrap gap-2 pt-2 border-top small" style={{ borderColor: 'var(--border-color)' }}>
                          <span className="badge bg-danger bg-opacity-25 text-danger">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                            {dayjs(s.showDate).format('ddd, MMM D, YYYY')}
                          </span>
                          <span className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {s.showTime}
                          </span>
                          <span className="badge bg-success bg-opacity-25 text-success ms-auto">
                            {s.availableSeats ?? s.totalSeats ?? 70} Seats Available
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small" style={{ color: 'var(--text-secondary)' }}>No scheduled shows found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddShowPage;
