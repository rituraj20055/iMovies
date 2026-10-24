const axios = require('axios');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'c5cc193b6902f41d06168e18398fba37';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.tmdb.org/3';

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 4000,
  params: {
    api_key: TMDB_API_KEY,
  },
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'iMoviesApp/1.0',
  },
});

// Automatic fallback between api.tmdb.org and api.themoviedb.org
tmdbClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (config && !config._retried) {
      config._retried = true;
      if (config.baseURL && config.baseURL.includes('api.themoviedb.org')) {
        config.baseURL = 'https://api.tmdb.org/3';
        return tmdbClient(config);
      } else if (config.baseURL && config.baseURL.includes('api.tmdb.org')) {
        config.baseURL = 'https://api.themoviedb.org/3';
        return tmdbClient(config);
      }
    }
    return Promise.reject(error);
  }
);

// Genre ID to name map
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Language map
const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  ko: 'Korean',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  zh: 'Chinese',
};

// In-memory cache for API responses (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const getFromCache = (key) => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setInCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Format duration minutes to string e.g. "2h 15m"
 */
const formatRuntime = (runtimeMinutes) => {
  if (!runtimeMinutes || runtimeMinutes <= 0) return '2h 10m';
  const hrs = Math.floor(runtimeMinutes / 60);
  const mins = runtimeMinutes % 60;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
};

/**
 * Maps raw TMDB item into our standard Movie schema structure
 */
const formatTMDBMovie = (tmdbItem, details = null) => {
  const genres = [];
  if (details && Array.isArray(details.genres) && details.genres.length > 0) {
    details.genres.forEach((g) => genres.push(g.name === 'Science Fiction' ? 'Sci-Fi' : g.name));
  } else if (Array.isArray(tmdbItem?.genre_ids)) {
    tmdbItem.genre_ids.forEach((id) => {
      if (GENRE_MAP[id]) genres.push(GENRE_MAP[id]);
    });
  } else if (Array.isArray(tmdbItem?.genres)) {
    genres.push(...tmdbItem.genres);
  }
  if (genres.length === 0) genres.push('Action', 'Drama');

  // Duration
  const duration = details?.runtime ? formatRuntime(details.runtime) : (tmdbItem?.duration || '2h 15m');

  // Cast & Director
  let cast = Array.isArray(tmdbItem?.cast) && tmdbItem.cast.length > 1 ? tmdbItem.cast : [];
  let director = tmdbItem?.director || '';
  if (details?.credits) {
    if (Array.isArray(details.credits.cast) && details.credits.cast.length > 0) {
      cast = details.credits.cast.slice(0, 5).map((c) => c.name);
    }
    if (Array.isArray(details.credits.crew)) {
      const dirObj = details.credits.crew.find((c) => c.job === 'Director');
      if (dirObj) director = dirObj.name;
    }
  }

  // Trailer
  let trailer = tmdbItem?.trailer || '';
  if (details?.videos?.results && Array.isArray(details.videos.results)) {
    const officialTrailer = details.videos.results.find(
      (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
    );
    if (officialTrailer) {
      trailer = `https://www.youtube.com/watch?v=${officialTrailer.key}`;
    }
  }

  // Certification fallback
  let certification = tmdbItem?.certification || 'U/A';
  if (details?.release_dates?.results) {
    const usOrIn = details.release_dates.results.find(
      (r) => r.iso_3166_1 === 'US' || r.iso_3166_1 === 'IN'
    );
    if (usOrIn?.release_dates?.[0]?.certification) {
      certification = usOrIn.release_dates[0].certification;
    }
  }

  const rawPoster = details?.poster_path || tmdbItem?.poster_path;
  const poster = rawPoster
    ? `https://image.tmdb.org/t/p/w500${rawPoster}`
    : (tmdbItem?.poster || tmdbItem?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80');

  const rawBackdrop = details?.backdrop_path || tmdbItem?.backdrop_path;
  const backdrop = rawBackdrop
    ? `https://image.tmdb.org/t/p/original${rawBackdrop}`
    : (tmdbItem?.backdrop || '');

  const languageCode = details?.original_language || tmdbItem?.original_language || 'en';
  const language = LANGUAGE_MAP[languageCode] || tmdbItem?.language || languageCode.toUpperCase();

  const rawOverview = details?.overview || tmdbItem?.overview || tmdbItem?.description;
  const description =
    rawOverview && rawOverview.trim().length >= 10
      ? rawOverview.trim()
      : 'Experience this thrilling live cinematic blockbuster currently screening in theatres.';

  const movieName =
    details?.title ||
    details?.original_title ||
    tmdbItem?.title ||
    tmdbItem?.original_title ||
    tmdbItem?.movieName ||
    'Untitled Movie';

  const rawRating = details?.vote_average || tmdbItem?.vote_average || tmdbItem?.rating || 7.8;
  const rating = Number(Number(rawRating).toFixed(1));
  const voteCount = details?.vote_count || tmdbItem?.vote_count || tmdbItem?.voteCount || 0;

  const releaseDateRaw = details?.release_date || tmdbItem?.release_date || tmdbItem?.releaseDate;
  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : new Date();

  return {
    tmdbId: details?.id || tmdbItem?.id || tmdbItem?.tmdbId,
    movieName,
    description,
    genres,
    releaseDate,
    language,
    duration,
    certification: certification || 'U/A',
    poster,
    posterUrl: poster,
    backdrop,
    trailer: trailer || 'https://www.youtube.com/watch?v=Way9Dexny3w',
    cast: cast.length > 0 ? cast : ['Leading Cast'],
    director: director || 'Acclaimed Director',
    rating,
    voteCount,
    tagline: details?.tagline || tmdbItem?.tagline || '',
    isActive: true,
  };
};

/**
 * Fetch Now Playing movies from TMDB
 */
const fetchNowPlayingFromTMDB = async (page = 1) => {
  const cacheKey = `now_playing_${page}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await tmdbClient.get('/movie/now_playing', {
    params: { page, language: 'en-US' },
  });

  const results = response.data?.results || [];
  setInCache(cacheKey, results);
  return results;
};

/**
 * Fetch Popular movies from TMDB
 */
const fetchPopularFromTMDB = async (page = 1) => {
  const cacheKey = `popular_${page}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await tmdbClient.get('/movie/popular', {
    params: { page, language: 'en-US' },
  });

  const results = response.data?.results || [];
  setInCache(cacheKey, results);
  return results;
};

/**
 * Search movies from TMDB
 */
const searchMoviesFromTMDB = async (query, page = 1) => {
  if (!query || !query.trim()) return [];
  const cacheKey = `search_${query.trim().toLowerCase()}_${page}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await tmdbClient.get('/search/movie', {
    params: { query: query.trim(), page, language: 'en-US' },
  });

  const results = response.data?.results || [];
  setInCache(cacheKey, results);
  return results;
};

/**
 * Fetch rich details including credits and videos for a specific TMDB movie
 */
const fetchMovieDetailsFromTMDB = async (tmdbId) => {
  const cacheKey = `details_${tmdbId}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await tmdbClient.get(`/movie/${tmdbId}`, {
    params: {
      append_to_response: 'credits,videos,release_dates',
      language: 'en-US',
    },
  });

  const data = response.data;
  setInCache(cacheKey, data);
  return data;
};

/**
 * Helper to build initial ticket layout for a show
 */
const buildInitialTickets = (theatre) => {
  const tickets = {};
  const buildSection = (seats, tier, price) => {
    Object.keys(seats || {}).forEach((seatId) => {
      tickets[`${tier}_${seatId}`] = { status: 'available', tier, price, seatId };
    });
  };
  buildSection(theatre.balconySeats || {}, 'balcony', theatre.balconySeatPrice || 400);
  buildSection(theatre.middleSeats || {}, 'middle', theatre.middleSeatPrice || 280);
  buildSection(theatre.lowerSeats || {}, 'lower', theatre.lowerSeatPrice || 180);
  return tickets;
};

/**
 * Auto-generate shows for a movie across theatres if no shows currently exist
 */
const ensureShowsForMovie = async (movieDoc) => {
  try {
    const existingShows = await Show.countDocuments({ movieId: movieDoc._id.toString() });
    if (existingShows > 0) return;

    let theatres = await Theatre.find({ isActive: true });
    if (!theatres || theatres.length === 0) {
      theatres = await Theatre.find({});
    }
    if (!theatres || theatres.length === 0) return;

    const showTimes = ['10:30 AM', '02:00 PM', '06:15 PM', '09:45 PM'];
    const showsToCreate = [];

    // Schedule shows for today + next 4 days
    for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
      const showDate = dayjs().add(dayOffset, 'day').format('YYYY-MM-DD');

      for (const theatre of theatres.slice(0, 3)) {
        for (const time of showTimes.slice(0, 3)) {
          const tickets = buildInitialTickets(theatre);
          // Pre-reserve a couple seats for realism
          if (tickets['balcony_A1']) tickets['balcony_A1'].status = 'booked';
          if (tickets['balcony_A2']) tickets['balcony_A2'].status = 'booked';
          if (tickets['middle_B5'])  tickets['middle_B5'].status  = 'booked';

          showsToCreate.push({
            showId: uuidv4(),
            movieId: movieDoc._id.toString(),
            theatreId: theatre.theatreId,
            theatreName: theatre.theatreName,
            adminEmail: theatre.adminEmail || 'admin@imovies.com',
            showDate,
            showTime: time,
            tickets,
            isActive: true,
          });
        }
      }
    }

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }
  } catch (err) {
    console.error('Error auto-generating shows for movie:', movieDoc.movieName, err.message);
  }
};

/**
 * Synchronize a list of raw TMDB movie items into MongoDB.
 * Upserts by tmdbId, returns the saved Mongoose Movie documents.
 */
const syncTMDBMoviesToDatabase = async (rawTmdbList, fetchFullDetails = false) => {
  const syncedMovies = [];

  for (const rawItem of rawTmdbList) {
    if (!rawItem || !rawItem.title) continue;

    try {
      let details = null;
      if (fetchFullDetails) {
        try {
          details = await fetchMovieDetailsFromTMDB(rawItem.id);
        } catch (detailErr) {
          // Non-fatal: proceed with basic TMDB data
        }
      }

      const formatted = formatTMDBMovie(rawItem, details);

      // Check if this movie was deleted or archived by admin
      const existing = await Movie.findOne({ tmdbId: rawItem.id });
      if (existing && existing.isActive === false) {
        // Preserves admin deletion/archive! Do NOT reactivate or re-insert
        continue;
      }

      const movieDoc = await Movie.findOneAndUpdate(
        { tmdbId: rawItem.id },
        { $set: formatted },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Auto ensure shows exist so user can book this movie immediately
      await ensureShowsForMovie(movieDoc);

      syncedMovies.push(movieDoc);
    } catch (err) {
      console.warn(`Could not sync TMDB movie ${rawItem.id}:`, err.message);
    }
  }

  return syncedMovies;
};

/**
 * High-level service method: get live market movies (now playing / popular)
 * Falls back to MongoDB if TMDB API is unreachable.
 */
const getLiveMarketMovies = async ({ page = 1, search = '', genre = '', language = '' } = {}) => {
  try {
    let rawList = [];

    if (search && search.trim()) {
      rawList = await searchMoviesFromTMDB(search.trim(), page);
    } else {
      // Fetch both now_playing and popular to give a wide market selection
      const [nowPlaying, popular] = await Promise.allSettled([
        fetchNowPlayingFromTMDB(page),
        fetchPopularFromTMDB(page),
      ]);

      const npList = nowPlaying.status === 'fulfilled' ? nowPlaying.value : [];
      const popList = popular.status === 'fulfilled' ? popular.value : [];

      // Deduplicate by ID
      const map = new Map();
      [...npList, ...popList].forEach((m) => {
        if (m && m.id && !map.has(m.id)) {
          map.set(m.id, m);
        }
      });
      rawList = Array.from(map.values());
    }

    if (rawList.length > 0) {
      // Sync the top 15 movies into database so they have valid MongoDB ObjectIds and shows
      const syncedDocs = await syncTMDBMoviesToDatabase(rawList.slice(0, 18), false);

      // Apply in-memory filters if needed
      let filtered = syncedDocs;
      if (genre && genre !== 'ALL') {
        filtered = filtered.filter((m) =>
          m.genres && m.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
        );
      }
      if (language && language !== 'ALL') {
        filtered = filtered.filter(
          (m) => m.language && m.language.toLowerCase().includes(language.toLowerCase())
        );
      }

      // Also fetch any custom movies added by admin directly in MongoDB
      const customFilter = { isActive: { $ne: false } };
      if (genre && genre !== 'ALL') customFilter.genres = { $in: [genre] };
      if (language && language !== 'ALL') customFilter.language = { $regex: language, $options: 'i' };
      if (search && search.trim()) customFilter.movieName = { $regex: search.trim(), $options: 'i' };
      customFilter.$or = [{ tmdbId: { $exists: false } }, { tmdbId: null }];

      const customMovies = await Movie.find(customFilter).sort({ createdAt: -1 });

      // Merge custom admin movies first, then TMDB market movies (deduplicate strictly by ID and normalized title)
      const combined = [...customMovies, ...filtered];
      const idSet = new Set();
      const titleSet = new Set();
      const uniqueMovies = [];
      for (const m of combined) {
        if (!m || !m._id) continue;
        if (m.isActive === false) continue;
        const idStr = String(m._id);
        const normTitle = (m.movieName || '').trim().toLowerCase();
        if (!idSet.has(idStr) && (!normTitle || !titleSet.has(normTitle))) {
          idSet.add(idStr);
          if (normTitle) titleSet.add(normTitle);
          uniqueMovies.push(m);
        }
      }

      if (uniqueMovies.length > 0) {
        return uniqueMovies;
      }
    }
  } catch (err) {
    console.warn('⚠️ TMDB Live fetch error, falling back to database:', err.message);
  }

  // Fallback: Query MongoDB directly with deduplication
  const filter = { isActive: { $ne: false } };
  if (genre && genre !== 'ALL') filter.genres = { $in: [genre] };
  if (language && language !== 'ALL') filter.language = { $regex: language, $options: 'i' };
  if (search && search.trim()) filter.movieName = { $regex: search.trim(), $options: 'i' };

  const dbMovies = await Movie.find(filter).sort({ createdAt: -1 });
  const idSet = new Set();
  const titleSet = new Set();
  const uniqueFallback = [];
  for (const m of dbMovies) {
    if (!m || !m._id) continue;
    if (m.isActive === false) continue;
    const idStr = String(m._id);
    const normTitle = (m.movieName || '').trim().toLowerCase();
    if (!idSet.has(idStr) && (!normTitle || !titleSet.has(normTitle))) {
      idSet.add(idStr);
      if (normTitle) titleSet.add(normTitle);
      uniqueFallback.push(m);
    }
  }

  return uniqueFallback;
};

/**
 * Fetch single movie either from MongoDB or live from TMDB if not found locally
 */
const getOrFetchMovie = async (identifier) => {
  // 1. Try finding by MongoDB _id
  if (identifier && identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)) {
    const local = await Movie.findById(identifier);
    if (local) {
      // If it has tmdbId and lacks full cast/trailer, try enriching in background
      if (local.tmdbId && (!local.cast || local.cast.length <= 1 || !local.trailer)) {
        try {
          const details = await fetchMovieDetailsFromTMDB(local.tmdbId);
          const enriched = formatTMDBMovie({ id: local.tmdbId, ...local.toObject() }, details);
          Object.assign(local, enriched);
          await local.save();
        } catch (e) {}
      }
      await ensureShowsForMovie(local);
      return local;
    }
  }

  // 2. Try finding by tmdbId numeric
  const numericId = Number(identifier);
  if (!isNaN(numericId) && numericId > 0) {
    const localByTmdb = await Movie.findOne({ tmdbId: numericId });
    if (localByTmdb) {
      await ensureShowsForMovie(localByTmdb);
      return localByTmdb;
    }

    // 3. Not in DB yet: fetch live from TMDB by TMDB ID!
    try {
      const details = await fetchMovieDetailsFromTMDB(numericId);
      if (details && details.title) {
        const formatted = formatTMDBMovie(details, details);
        const newDoc = await Movie.create(formatted);
        await ensureShowsForMovie(newDoc);
        return newDoc;
      }
    } catch (tmdbErr) {
      console.warn(`Could not fetch TMDB movie with ID ${identifier}:`, tmdbErr.message);
    }
  }

  // 4. Try finding by title regex
  return await Movie.findOne({ movieName: { $regex: identifier, $options: 'i' } });
};

module.exports = {
  tmdbClient,
  fetchNowPlayingFromTMDB,
  fetchPopularFromTMDB,
  searchMoviesFromTMDB,
  fetchMovieDetailsFromTMDB,
  formatTMDBMovie,
  syncTMDBMoviesToDatabase,
  getLiveMarketMovies,
  getOrFetchMovie,
  ensureShowsForMovie,
};
