import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faPen,
  faTrash,
  faPlus,
  faTimes,
  faSpinner,
  faImage,
  faCalendarAlt,
  faClock,
  faLanguage,
  faCertificate,
  faUserTie,
  faUsers,
  faVideo,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import './AdminDashboard.css';
import './AdminForms.css';

/* ── Genre & select options ──────────────────────────────────── */
const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi',
  'Thriller', 'Romance', 'Animation', 'Documentary',
  'Fantasy', 'Mystery', 'Adventure',
];

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu',
  'Malayalam', 'Kannada', 'French', 'Spanish', 'Japanese',
];

const CERTIFICATIONS = ['U', 'UA', 'A', 'PG', 'PG-13', 'R'];

const EMPTY_FORM = {
  name: '',
  description: '',
  genres: [],
  releaseDate: '',
  language: 'English',
  duration: '',
  certification: 'UA',
  director: '',
  cast: '',
  poster: '',
  trailer: '',
};

/**
 * AddMoviePage – Professional Admin Page for Movie Catalogue Management
 * Features a balanced 2-column grid, responsive multi-row genre chips,
 * integrated poster preview, and a compact data catalogue table.
 */
const AddMoviePage = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [errors, setErrors]               = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [movies, setMovies]               = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [editId, setEditId]               = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [posterPreview, setPosterPreview] = useState('');
  const [imgError, setImgError]           = useState(false);
  const formRef = useRef(null);

  const token = localStorage.getItem('adminToken');

  // ── Fetch movies ───────────────────────────────────────────────────────────
  const fetchMovies = async () => {
    try {
      setLoadingMovies(true);
      const res = await api.get('/api/movie');
      setMovies(res.data?.movies || res.data || []);
    } catch {
      toast.error('Failed to load movies.');
    } finally {
      setLoadingMovies(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchMovies();
  }, [token, navigate]);

  // ── Update poster preview when URL changes ─────────────────────────────────
  useEffect(() => {
    setPosterPreview(form.poster);
    setImgError(false);
  }, [form.poster]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())                   e.name          = 'Movie name is required.';
    if (form.description.trim().length < 10) e.description   = 'Description must be at least 10 characters.';
    if (form.genres.length === 0)            e.genres        = 'Select at least one genre.';
    if (!form.releaseDate)                   e.releaseDate   = 'Release date is required.';
    if (!form.language)                      e.language      = 'Language is required.';
    if (!form.duration.trim())               e.duration      = 'Duration is required (e.g., 2h 30m).';
    if (!form.certification)                 e.certification = 'Certification is required.';
    if (!form.director.trim())               e.director      = 'Director name is required.';
    if (!form.cast.trim())                   e.cast          = 'At least one cast member is required.';
    return e;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleGenreToggle = (genre) => {
    setForm((f) => {
      const already = f.genres.includes(genre);
      return {
        ...f,
        genres: already ? f.genres.filter((g) => g !== genre) : [...f.genres, genre],
      };
    });
    setErrors((err) => ({ ...err, genres: undefined }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setPosterPreview('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      toast.error('Please resolve the errors highlighted below.');
      return;
    }

    const payload = {
      ...form,
      movieName: form.name.trim(),
      name: form.name.trim(),
      cast: form.cast.split(',').map((c) => c.trim()).filter(Boolean),
    };

    try {
      setSubmitting(true);
      if (editId) {
        await api.put(`/api/movie/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Movie updated successfully! 🎬');
      } else {
        await api.post('/api/movie', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Movie added successfully! 🎬');
      }
      resetForm();
      fetchMovies();
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save movie.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (movie) => {
    setEditId(movie._id);
    setForm({
      name:          movie.movieName     || movie.name          || '',
      description:   movie.description   || '',
      genres:        movie.genres        || [],
      releaseDate:   movie.releaseDate   ? movie.releaseDate.split('T')[0] : '',
      language:      movie.language      || 'English',
      duration:      movie.duration      || '',
      certification: movie.certification || 'UA',
      director:      movie.director      || '',
      cast:          Array.isArray(movie.cast) ? movie.cast.join(', ') : (movie.cast || ''),
      poster:        movie.poster        || '',
      trailer:       movie.trailer       || '',
    });
    setErrors({});
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (movie) => {
    if (!movie || !movie._id || isDeleting) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/api/movie/${movie._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data?.message || 'Movie deleted successfully.');
      setMovies((prev) => prev.filter((m) => String(m._id) !== String(movie._id)));
      setDeleteConfirm(null);
      await fetchMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete movie.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-content-container">
          {/* ── Page Header ── */}
          <header className="admin-page-header">
            <div>
              <h1 className="admin-page-title">
                <FontAwesomeIcon icon={faFilm} style={{ color: 'var(--primary-accent)', marginRight: 12 }} />
                <span>{editId ? 'Edit Movie' : 'Add Movie'}</span>
              </h1>
              <p className="admin-page-subtitle">
                Manage the iMovies market catalogue with live updates and seat layouts
              </p>
            </div>
            {editId && (
              <button type="button" className="btn--ghost" onClick={resetForm}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Add New Instead</span>
              </button>
            )}
          </header>

          {/* ── Movie Form Card ── */}
          <section className="admin-card" ref={formRef}>
            <h2 className="section-title">
              <FontAwesomeIcon icon={editId ? faPen : faPlus} style={{ color: 'var(--primary-accent)' }} />
              <span>{editId ? 'Edit Movie Details' : 'Movie Information'}</span>
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              <div className="admin-form-grid">
                {/* Row 1: Movie Name | Release Date */}
                <div className="form-group">
                  <label className="form-label" htmlFor="movie-name">
                    <span>Movie Name *</span>
                  </label>
                  <input
                    id="movie-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                    placeholder="e.g., Inception, The Dark Knight"
                  />
                  {errors.name && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="movie-release-date">
                    <span>Release Date *</span>
                  </label>
                  <input
                    id="movie-release-date"
                    type="date"
                    name="releaseDate"
                    value={form.releaseDate}
                    onChange={handleChange}
                    className={`form-input ${errors.releaseDate ? 'form-input--error' : ''}`}
                  />
                  {errors.releaseDate && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.releaseDate}
                    </span>
                  )}
                </div>

                {/* Row 2: Description (Full Width) */}
                <div className="form-group form-group--full">
                  <label className="form-label" htmlFor="movie-description">
                    <span>Synopsis & Description * (min 10 characters)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {form.description.length} chars
                    </span>
                  </label>
                  <textarea
                    id="movie-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
                    placeholder="Enter an engaging, cinematic overview of the plot and storyline..."
                  />
                  {errors.description && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.description}
                    </span>
                  )}
                </div>

                {/* Row 3: Genre Selection (Full Width Multi-Row Grid) */}
                <div className="form-group form-group--full">
                  <label className="form-label">
                    <span>Genres * (select one or more)</span>
                    {form.genres.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary-accent)' }}>
                        {form.genres.length} selected
                      </span>
                    )}
                  </label>
                  <div className="genre-grid">
                    {GENRES.map((g) => {
                      const isActive = form.genres.includes(g);
                      return (
                        <label
                          key={g}
                          className={`genre-chip ${isActive ? 'genre-chip--active' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleGenreToggle(g)}
                            className="genre-chip__input"
                          />
                          <span>{g}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.genres && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.genres}
                    </span>
                  )}
                </div>

                {/* Row 4: Language | Duration */}
                <div className="form-group">
                  <label className="form-label" htmlFor="movie-language">
                    <span>Language *</span>
                  </label>
                  <select
                    id="movie-language"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    className="form-input form-select"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {errors.language && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.language}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="movie-duration">
                    <span>Duration * (e.g., 2h 30m)</span>
                  </label>
                  <input
                    id="movie-duration"
                    type="text"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    className={`form-input ${errors.duration ? 'form-input--error' : ''}`}
                    placeholder="e.g., 2h 28m"
                  />
                  {errors.duration && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.duration}
                    </span>
                  )}
                </div>

                {/* Row 5: Certification | Director */}
                <div className="form-group">
                  <label className="form-label" htmlFor="movie-certification">
                    <span>Certification *</span>
                  </label>
                  <select
                    id="movie-certification"
                    name="certification"
                    value={form.certification}
                    onChange={handleChange}
                    className="form-input form-select"
                  >
                    {CERTIFICATIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.certification && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.certification}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="movie-director">
                    <span>Director *</span>
                  </label>
                  <input
                    id="movie-director"
                    type="text"
                    name="director"
                    value={form.director}
                    onChange={handleChange}
                    className={`form-input ${errors.director ? 'form-input--error' : ''}`}
                    placeholder="e.g., Christopher Nolan"
                  />
                  {errors.director && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.director}
                    </span>
                  )}
                </div>

                {/* Row 6: Cast | Trailer URL */}
                <div className="form-group">
                  <label className="form-label" htmlFor="movie-cast">
                    <span>Cast * (comma-separated)</span>
                  </label>
                  <input
                    id="movie-cast"
                    type="text"
                    name="cast"
                    value={form.cast}
                    onChange={handleChange}
                    className={`form-input ${errors.cast ? 'form-input--error' : ''}`}
                    placeholder="e.g., Leonardo DiCaprio, Joseph Gordon-Levitt"
                  />
                  {errors.cast && (
                    <span className="form-error">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {errors.cast}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="movie-trailer">
                    <span>Trailer URL (YouTube / Embed)</span>
                  </label>
                  <input
                    id="movie-trailer"
                    type="url"
                    name="trailer"
                    value={form.trailer}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                {/* Row 7: Poster URL with Connected Real-time Preview */}
                <div className="form-group form-group--full">
                  <label className="form-label" htmlFor="movie-poster">
                    <span>Poster Image URL</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Recommended ratio: 2:3 (e.g., 600×900)
                    </span>
                  </label>
                  <div className="poster-field-row">
                    <div className="poster-field-input">
                      <input
                        id="movie-poster"
                        type="url"
                        name="poster"
                        value={form.poster}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="https://image.tmdb.org/t/p/w500/..."
                      />
                      <p className="small mt-1 mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Enter a direct image link. A preview of the poster appears immediately in the frame to the right.
                      </p>
                    </div>

                    <div className="poster-preview-container">
                      <div className="poster-preview">
                        {posterPreview && !imgError ? (
                          <img
                            src={posterPreview}
                            alt="Poster preview"
                            onError={() => setImgError(true)}
                          />
                        ) : (
                          <div className="poster-preview__placeholder">
                            <FontAwesomeIcon icon={faImage} size="2x" />
                            <span>{imgError ? 'Invalid URL' : 'No Preview'}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live Preview</span>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="form-actions">
                  {editId && (
                    <button type="button" className="btn--ghost" onClick={resetForm}>
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Cancel</span>
                    </button>
                  )}
                  <button type="submit" className="btn--primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Saving Movie...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={editId ? faPen : faPlus} />
                        <span>{editId ? 'Update Movie Catalogue' : 'Save & Publish Movie'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* ── All Movies Catalogue Table ── */}
          <section className="admin-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="section-title mb-0" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <FontAwesomeIcon icon={faFilm} style={{ color: 'var(--primary-accent)' }} />
                <span>All Movies in Catalogue ({movies.length})</span>
              </h2>
              <span className="badge-ott-cyan">
                {movies.length} {movies.length === 1 ? 'Title Active' : 'Titles Active'}
              </span>
            </div>

            {loadingMovies ? (
              <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: 'var(--primary-accent)', marginBottom: 12 }} />
                <div>Loading catalogue data...</div>
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
                <FontAwesomeIcon icon={faFilm} size="3x" style={{ opacity: 0.3, marginBottom: 12 }} />
                <p className="mb-0">No movies found in the catalogue. Add your first movie above!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '64px', textAlign: 'center' }}>Poster</th>
                      <th>Movie Name</th>
                      <th>Language</th>
                      <th>Duration</th>
                      <th>Cert.</th>
                      <th>Genres</th>
                      <th>Release</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((m) => (
                      <tr key={m._id}>
                        <td style={{ textAlign: 'center' }}>
                          {m.poster ? (
                            <img
                              src={m.poster}
                              alt={m.movieName || m.name}
                              className="movie-thumb mx-auto"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="movie-thumb movie-thumb--empty mx-auto">
                              <FontAwesomeIcon icon={faImage} />
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.movieName || m.name}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {m.language || 'English'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {m.duration || '—'}
                        </td>
                        <td>
                          <span className="badge-ott" style={{ fontSize: '0.72rem' }}>
                            {m.certification || 'U/A'}
                          </span>
                        </td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          {Array.isArray(m.genres) ? m.genres.join(', ') : m.genres || '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {m.releaseDate ? m.releaseDate.split('T')[0] : '—'}
                        </td>
                        <td>
                          <div className="action-btns justify-content-center">
                            <button
                              type="button"
                              className="icon-btn icon-btn--edit"
                              onClick={() => handleEdit(m)}
                              title="Edit Movie"
                              aria-label={`Edit ${m.movieName || m.name}`}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn--delete"
                              onClick={() => setDeleteConfirm(m)}
                              title="Delete Movie"
                              aria-label={`Delete ${m.movieName || m.name}`}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Delete Confirmation Modal ── */}
          {deleteConfirm && (
            <div className="modal-overlay" onClick={() => !isDeleting && setDeleteConfirm(null)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal__header">
                  <div className="admin-modal__icon">
                    <FontAwesomeIcon icon={faTrash} />
                  </div>
                  <div>
                    <h3 className="admin-modal__title">Delete Movie?</h3>
                    <div className="admin-modal__movie-title">
                      {deleteConfirm.movieName || deleteConfirm.name}
                    </div>
                  </div>
                </div>
                <p className="admin-modal__desc">
                  Are you sure you want to remove this movie? If it has existing booking history, it will be safely archived from the active catalogue to preserve customer tickets and financial records.
                </p>
                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="btn btn-glass"
                    disabled={isDeleting}
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4 fw-bold d-inline-flex align-items-center gap-2"
                    disabled={isDeleting}
                    onClick={() => handleDelete(deleteConfirm)}
                  >
                    {isDeleting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Yes, Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddMoviePage;
