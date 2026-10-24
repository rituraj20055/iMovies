import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroBillboard from '../components/HeroBillboard';
import MovieRow from '../components/MovieRow';
import MovieCard from '../components/MovieCard';
import api from '../utils/api';
import { deduplicateMovies } from '../utils/movieUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faTimes,
  faFilm,
  faFire,
  faStar,
  faHeart,
  faBolt,
  faTicketAlt,
  faSortAmountDown,
  faRedo,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Sci-Fi',
  'Thriller',
  'Romance',
  'Animation',
  'Crime',
  'Fantasy',
  'Documentary',
];

const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Korean'];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured Spotlight' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'releaseDate', label: 'Release Date: Newest' },
  { value: 'name', label: 'Title: A-Z' },
];

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [userFavorites, setUserFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const initialFetchDone = useRef(false);

  // Fetch movies based on filters
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedGenre !== 'All') params.genre = selectedGenre;
      if (selectedLanguage !== 'All') params.language = selectedLanguage;

      const res = await api.get('/api/movie', { params });
      let list = deduplicateMovies(res.data.movies || res.data || []);

      // Client-side sort
      if (sortBy === 'rating') {
        list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === 'releaseDate') {
        list = [...list].sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      } else if (sortBy === 'name') {
        list = [...list].sort((a, b) => (a.movieName || '').localeCompare(b.movieName || ''));
      }

      setMovies(list);
    } catch (err) {
      console.error('Failed to load movies:', err);
      setError(err?.response?.data?.message || 'Unable to load movies. Server might be waking up or offline.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre, selectedLanguage, sortBy]);

  // Fetch featured movies & user favorites on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [featRes, favRes] = await Promise.allSettled([
          api.get('/api/movie/featured'),
          api.get('/api/favorite'),
        ]);

        if (featRes.status === 'fulfilled') {
          const rawFeat = featRes.value.data.movies || featRes.value.data || [];
          setFeaturedMovies(deduplicateMovies(rawFeat));
        }
        if (favRes.status === 'fulfilled') {
          const favs = favRes.value.data.favorites || favRes.value.data || [];
          const favIds = new Set(
            favs.map((f) => (f.movieId?._id ? f.movieId._id : f.movieId || f))
          );
          setUserFavorites(favIds);

          const fullFavMovies = favs
            .map((f) => (typeof f.movieId === 'object' ? f.movieId : null))
            .filter(Boolean);
          setWatchlistMovies(deduplicateMovies(fullFavMovies));
        }
      } catch (err) {
        console.error('Error fetching initial movies:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMovies();
      initialFetchDone.current = true;
    }, 280);
    return () => clearTimeout(timeoutId);
  }, [fetchMovies]);

  const handleFavoriteToggle = (movieId, isFav) => {
    setUserFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(movieId);
      else next.delete(movieId);
      return next;
    });

    if (!isFav) {
      setWatchlistMovies((prev) => prev.filter((m) => m._id !== movieId));
    } else {
      const found = movies.find((m) => m._id === movieId) || featuredMovies.find((m) => m._id === movieId);
      if (found) {
        setWatchlistMovies((prev) => deduplicateMovies([...prev, found]));
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedLanguage('All');
    setSortBy('featured');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || selectedGenre !== 'All' || selectedLanguage !== 'All' || sortBy !== 'featured';

  // Categorized movie rows for the OTT experience
  const trendingMovies = useMemo(() => {
    const source = featuredMovies.length > 0 ? featuredMovies : movies;
    return deduplicateMovies(source).slice(0, 8);
  }, [featuredMovies, movies]);

  // Now Showing in Theatres: actively prioritizes cinema titles not already in the trending row
  const nowShowingMovies = useMemo(() => {
    const trendingIds = new Set(trendingMovies.map((m) => (m._id || m.id || '').toString()));
    const nonTrending = movies.filter((m) => !trendingIds.has((m._id || m.id || '').toString()));
    if (nonTrending.length >= 4) {
      return deduplicateMovies(nonTrending);
    }
    return deduplicateMovies([...nonTrending, ...movies]);
  }, [movies, trendingMovies]);

  const actionMovies = useMemo(() => {
    const filtered = movies.filter((m) =>
      Array.isArray(m.genres)
        ? m.genres.some((g) => ['Action', 'Sci-Fi', 'Adventure'].includes(g))
        : ['Action', 'Sci-Fi', 'Adventure'].includes(m.genres)
    );
    return deduplicateMovies(filtered);
  }, [movies]);

  const topRatedMovies = useMemo(() => {
    const filtered = [...movies]
      .filter((m) => Number(m.rating || 0) >= 6.8)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return deduplicateMovies(filtered);
  }, [movies]);

  const dramaThrillerMovies = useMemo(() => {
    const filtered = movies.filter((m) =>
      Array.isArray(m.genres)
        ? m.genres.some((g) => ['Drama', 'Thriller', 'Horror', 'Mystery', 'Crime'].includes(g))
        : ['Drama', 'Thriller', 'Horror', 'Mystery', 'Crime'].includes(m.genres)
    );
    return deduplicateMovies(filtered);
  }, [movies]);

  // Loading skeleton placeholder for horizontal movie rows
  const renderRowSkeleton = (label) => (
    <div className="mb-5">
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="movie-row-indicator" />
        <h4 className="fw-bold mb-0 text-muted" style={{ fontSize: '1.15rem' }}>{label}</h4>
      </div>
      <div className="d-flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-4 placeholder-glow flex-shrink-0"
            style={{
              width: '180px',
              height: '270px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              className="placeholder rounded-3 w-100 h-100"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1">
        {/* Cinematic Hero Billboard (Shown when browsing default view) */}
        {!hasActiveFilters && (
          loading && movies.length === 0 ? (
            <div className="container pt-3 mb-4">
              <div
                className="rounded-4 placeholder-glow p-5 d-flex flex-column justify-content-end"
                style={{
                  minHeight: '360px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="placeholder col-6 mb-3" style={{ height: '36px', backgroundColor: 'var(--bg-surface)' }} />
                <div className="placeholder col-4 mb-4" style={{ height: '20px', backgroundColor: 'var(--bg-surface)' }} />
                <div className="placeholder col-8" style={{ height: '16px', backgroundColor: 'var(--bg-surface)' }} />
              </div>
            </div>
          ) : trendingMovies.length > 0 ? (
            <HeroBillboard
              movies={trendingMovies}
              userFavorites={userFavorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ) : null
        )}

        <div className="container py-3">
          {/* Advanced Search & OTT Filter Bar */}
          <section className="ott-filter-bar">
            <div className="row g-3 align-items-center">
              {/* Search Field */}
              <div className="col-12 col-md-5">
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3.5"
                    style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}
                  />
                  <input
                    type="text"
                    className="form-control ott-search-input"
                    placeholder="Search blockbusters by title, actor, or genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 border-0"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear Search"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>

              {/* Language Selector */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-control-dark"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  aria-label="Filter by Language"
                >
                  <option value="All">All Languages</option>
                  {LANGUAGES.filter((l) => l !== 'All').map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Selector */}
              <div className="col-6 col-md-4 d-flex align-items-center justify-content-end gap-2">
                <div className="d-flex align-items-center gap-1.5 flex-grow-1">
                  <FontAwesomeIcon icon={faSortAmountDown} className="d-none d-sm-inline" style={{ color: 'var(--text-muted)' }} />
                  <select
                    className="form-select form-control-dark"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort movies"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 text-nowrap"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Genre Filter Pills */}
            <div className="d-flex align-items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              <span className="small fw-bold text-uppercase d-flex align-items-center gap-1 me-1 text-nowrap" style={{ color: 'var(--text-muted)' }}>
                <FontAwesomeIcon icon={faFilter} style={{ color: 'var(--primary-accent)' }} />
                Genre:
              </span>
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`ott-genre-pill ${selectedGenre === genre ? 'active' : ''}`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          {/* OTT Content Presentation: Filter Grid VS Curated OTT Rows */}
          {hasActiveFilters ? (
            /* FILTER RESULTS GRID */
            <section className="mb-5">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="movie-row-indicator" />
                  <h2 className="movie-row-title">Search & Filter Results</h2>
                </div>
                <div className="badge-ott-cyan px-3 py-1">
                  {movies.length} {movies.length === 1 ? 'Movie Found' : 'Movies Found'}
                </div>
              </div>

              {loading ? (
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4 py-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="col">
                      <div
                        className="rounded-4 p-3 placeholder-glow"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          minHeight: '340px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div
                          className="rounded-3 mb-3 placeholder"
                          style={{ height: '240px', width: '100%', backgroundColor: 'var(--bg-surface)' }}
                        />
                        <div className="placeholder col-8 mb-2" style={{ backgroundColor: 'var(--bg-surface)' }} />
                        <div className="placeholder col-5" style={{ backgroundColor: 'var(--bg-surface)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div
                  className="text-center py-5 rounded-4 my-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="mb-3" style={{ fontSize: '3rem', color: 'var(--danger)' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} />
                  </div>
                  <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Failed to load results</h4>
                  <p className="mb-4 mx-auto text-secondary" style={{ maxWidth: '440px' }}>
                    {error}
                  </p>
                  <button type="button" onClick={() => fetchMovies()} className="btn-cyan px-4 py-2 d-inline-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faRedo} />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : movies.length > 0 ? (
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie._id}
                      movie={movie}
                      layout="grid"
                      isFavorite={userFavorites.has(movie._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state when no results match */
                <div
                  className="text-center py-5 rounded-4 my-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <div className="mb-3" style={{ fontSize: '3.5rem', color: 'var(--text-muted)' }}>
                    <FontAwesomeIcon icon={faFilm} />
                  </div>
                  <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Movies Found</h4>
                  <p className="mb-4 mx-auto" style={{ maxWidth: '440px', color: 'var(--text-secondary)' }}>
                    We couldn't find any titles matching your search criteria. Try modifying your search keywords or resetting filters.
                  </p>
                  <button type="button" onClick={clearFilters} className="btn-cyan px-4 py-2">
                    Show All Movies
                  </button>
                </div>
              )}
            </section>
          ) : error && movies.length === 0 ? (
            /* Error state for default view with retry */
            <div
              className="text-center py-5 rounded-4 my-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="mb-3" style={{ fontSize: '3.5rem', color: 'var(--danger)' }}>
                <FontAwesomeIcon icon={faExclamationCircle} />
              </div>
              <h3 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Unable to Load Movies</h3>
              <p className="mb-4 mx-auto text-secondary" style={{ maxWidth: '480px' }}>
                {error || 'Our movie servers are currently warming up or momentarily unreachable. Please click Retry below to load the cinema catalog.'}
              </p>
              <button
                type="button"
                onClick={() => fetchMovies()}
                className="btn btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2"
                style={{ fontWeight: 700 }}
              >
                <FontAwesomeIcon icon={faRedo} />
                <span>Retry Loading Blockbusters</span>
              </button>
            </div>
          ) : loading && movies.length === 0 ? (
            /* Loading skeletons for default view */
            <div className="mb-5">
              {renderRowSkeleton('Trending Now')}
              {renderRowSkeleton('Now Showing in Theatres')}
              {renderRowSkeleton('Action & Sci-Fi Universe')}
            </div>
          ) : (
            /* CURATED OTT CONTENT ROWS */
            <div className="mb-5">
              {/* Row 1: Trending Now */}
              <MovieRow
                title="Trending Now"
                icon={faFire}
                badgeText="Top 10"
                movies={trendingMovies}
                userFavorites={userFavorites}
                onFavoriteToggle={handleFavoriteToggle}
              />

              {/* Row 2: Now Showing in Theatres */}
              <MovieRow
                title="Now Showing in Theatres"
                icon={faTicketAlt}
                badgeText="Live Market"
                movies={nowShowingMovies}
                userFavorites={userFavorites}
                onFavoriteToggle={handleFavoriteToggle}
              />

              {/* Row 3: Action & Sci-Fi Universe */}
              {actionMovies.length > 0 && (
                <MovieRow
                  title="Action & Sci-Fi Universe"
                  icon={faBolt}
                  badgeText="Adrenaline"
                  movies={actionMovies}
                  userFavorites={userFavorites}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}

              {/* Row 4: Top Rated Blockbusters */}
              {topRatedMovies.length > 0 && (
                <MovieRow
                  title="Top Rated Blockbusters"
                  icon={faStar}
                  badgeText="Critically Acclaimed"
                  movies={topRatedMovies}
                  userFavorites={userFavorites}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}

              {/* Row 5: Dramas, Thrillers & Mysteries */}
              {dramaThrillerMovies.length > 0 && (
                <MovieRow
                  title="Edge-of-Your-Seat Thrillers & Dramas"
                  icon={faFilm}
                  movies={dramaThrillerMovies}
                  userFavorites={userFavorites}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}

              {/* Row 6: My Watchlist (when user has saved items) */}
              {watchlistMovies.length > 0 && (
                <MovieRow
                  title="My Watchlist"
                  icon={faHeart}
                  badgeText="Saved"
                  movies={watchlistMovies}
                  userFavorites={userFavorites}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
