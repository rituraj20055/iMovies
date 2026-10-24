const Movie = require('../models/movieModel');
const tmdbService = require('../services/tmdbService');
const { normalizeTitle } = require('../utils/dedupMovies');

/**
 * Deduplicate an array of movies by _id and normalized movieName
 */
const deduplicateList = (list) => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenTitles = new Set();
  const result = [];

  for (const m of list) {
    if (!m) continue;
    const id = m._id ? String(m._id) : '';
    const title = normalizeTitle(m.movieName);

    if (id && seenIds.has(id)) continue;
    if (title && seenTitles.has(title)) continue;

    if (id) seenIds.add(id);
    if (title) seenTitles.add(title);
    result.push(m);
  }

  return result;
};

// Simple in-memory response cache for movie listings (TTL: 30 seconds)
const movieCache = new Map();
const CACHE_TTL_MS = 30 * 1000;

const getCached = (key) => {
  const item = movieCache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data;
  }
  movieCache.delete(key);
  return null;
};

const setCached = (key, data) => {
  movieCache.set(key, { data, time: Date.now() });
};

const clearMovieCache = () => {
  movieCache.clear();
};

/**
 * GET /api/movie
 * Fetches movies with high performance directly from MongoDB Atlas.
 * Applies instant in-memory caching and only triggers TMDB sync if the database is unseeded.
 */
const getAllMovies = async (req, res) => {
  try {
    const { genre, language, search, page = 1, limit = 50 } = req.query;
    const cacheKey = `all_${genre || ''}_${language || ''}_${search || ''}_${page}_${limit}`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const filter = { isActive: { $ne: false } };

    if (search && search.trim()) {
      filter.movieName = { $regex: search.trim(), $options: 'i' };
    }
    if (genre && genre !== 'All' && genre !== 'ALL') {
      filter.genres = { $in: [new RegExp(`^${genre.trim()}$`, 'i')] };
    }
    if (language && language !== 'All' && language !== 'ALL') {
      filter.language = { $regex: language.trim(), $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    let movies = await Movie.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // If completely empty database (fresh deploy), run one-time TMDB sync
    if (movies.length === 0 && !search && (!genre || genre === 'All') && (!language || language === 'All')) {
      const totalInDb = await Movie.countDocuments();
      if (totalInDb === 0) {
        console.log('Database empty, running initial TMDB sync...');
        const rawMovies = await tmdbService.getLiveMarketMovies({ page: 1 });
        movies = deduplicateList(rawMovies);
      }
    } else if (movies.length === 0 && search && search.trim()) {
      // If user searched for a title not yet in DB, try quick TMDB lookup
      try {
        const tmdbResults = await tmdbService.searchMoviesFromTMDB(search.trim(), 1);
        if (tmdbResults && tmdbResults.length > 0) {
          const synced = await tmdbService.syncTMDBMoviesToDatabase(tmdbResults.slice(0, 5), false);
          if (synced && synced.length > 0) {
            movies = synced;
          }
        }
      } catch (searchErr) {
        // Non-fatal fallback
      }
    }

    const deduped = deduplicateList(movies);
    const responsePayload = { success: true, count: deduped.length, movies: deduped };
    setCached(cacheKey, responsePayload);

    res.json(responsePayload);
  } catch (err) {
    console.error('getAllMovies error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/featured
 * Ultra-fast query for top-rated blockbusters
 */
const getFeaturedMovies = async (req, res) => {
  try {
    const cacheKey = 'featured_movies';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    let movies = await Movie.find({ isActive: { $ne: false } })
      .sort({ rating: -1, voteCount: -1 })
      .limit(10)
      .lean();

    if (movies.length === 0) {
      movies = await Movie.find({ isActive: { $ne: false } }).limit(10).lean();
    }

    const deduped = deduplicateList(movies).slice(0, 8);
    const payload = { success: true, count: deduped.length, movies: deduped };
    setCached(cacheKey, payload);

    res.json(payload);
  } catch (err) {
    console.error('getFeaturedMovies error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/now-playing
 * Instant direct query for latest theatrical releases
 */
const getNowPlaying = async (req, res) => {
  try {
    const cacheKey = 'now_playing_movies';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const movies = await Movie.find({ isActive: { $ne: false } })
      .sort({ releaseDate: -1 })
      .limit(20)
      .lean();

    const deduped = deduplicateList(movies);
    const payload = { success: true, count: deduped.length, movies: deduped };
    setCached(cacheKey, payload);

    res.json(payload);
  } catch (err) {
    console.error('getNowPlaying error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/popular
 * Instant direct query for popular blockbusters
 */
const getPopular = async (req, res) => {
  try {
    const cacheKey = 'popular_movies';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const movies = await Movie.find({ isActive: { $ne: false } })
      .sort({ voteCount: -1, rating: -1 })
      .limit(20)
      .lean();

    const deduped = deduplicateList(movies);
    const payload = { success: true, count: deduped.length, movies: deduped };
    setCached(cacheKey, payload);

    res.json(payload);
  } catch (err) {
    console.error('getPopular error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/:id
 * Fetches movie by MongoDB ID instantly; falls back to TMDB lookup if not present
 */
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      const local = await Movie.findById(id).lean();
      if (local) {
        return res.json({ success: true, movie: local });
      }
    }

    const movie = await tmdbService.getOrFetchMovie(id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });
    res.json({ success: true, movie });
  } catch (err) {
    console.error('getMovieById error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const addMovie = async (req, res) => {
  try {
    const data = { ...req.body };
    // Normalize field naming differences (name vs movieName)
    if (!data.movieName && data.name) {
      data.movieName = data.name.trim();
    }
    if (typeof data.cast === 'string') {
      data.cast = data.cast.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!data.movieName || data.movieName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Movie name must be at least 2 characters.' });
    }
    if (!data.description || data.description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters.' });
    }
    if (!data.genres || !Array.isArray(data.genres) || data.genres.length === 0) {
      data.genres = ['Action'];
    }
    if (!data.releaseDate) {
      data.releaseDate = new Date();
    }
    if (!data.duration) {
      data.duration = '2h 15m';
    }
    if (!data.language) {
      data.language = 'English';
    }

    const trimmedName = data.movieName.trim();

    // Check if movie already exists with same normalized name to prevent duplicate creation
    const existing = await Movie.findOne({
      movieName: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      await tmdbService.ensureShowsForMovie(existing);
      clearMovieCache();
      return res.status(201).json({ success: true, movie: existing, updated: true });
    }

    const movie = await Movie.create(data);
    await tmdbService.ensureShowsForMovie(movie);
    clearMovieCache();
    res.status(201).json({ success: true, movie });
  } catch (err) {
    console.error('addMovie error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateMovie = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.movieName && data.name) {
      data.movieName = data.name.trim();
    }
    if (typeof data.cast === 'string') {
      data.cast = data.cast.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const movie = await Movie.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });
    clearMovieCache();
    res.json({ success: true, movie });
  } catch (err) {
    console.error('updateMovie error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    const movieIdStr = String(movie._id);

    // 1. Check if the movie is referenced by customer bookings
    const Booking = require('../models/bookingModel');
    const hasBookings = await Booking.exists({
      movieId: movieIdStr,
      paymentStatus: { $in: ['Completed', 'Confirmed', 'Pending'] },
    });

    const Show = require('../models/showModel');
    const existingShows = await Show.find({ movieId: movieIdStr });

    if (hasBookings) {
      // Data Integrity: Never delete financial records or active customer bookings!
      // Safely archive the movie by marking it inactive, preventing new bookings
      movie.isActive = false;
      await movie.save();

      // Deactivate upcoming shows that have no bookings
      for (const show of existingShows) {
        const hasShowBookings = await Booking.exists({
          showId: show.showId,
          paymentStatus: { $in: ['Completed', 'Confirmed'] },
        });
        if (!hasShowBookings) {
          show.isActive = false;
          await show.save();
        }
      }

      clearMovieCache();
      return res.json({
        success: true,
        message: `Movie "${movie.movieName}" has active booking history. It was safely archived and removed from the active catalogue while preserving customer reservations.`,
        archived: true,
        movieId: movie._id,
      });
    }

    // 2. If there are NO customer bookings, remove any unsold shows
    if (existingShows.length > 0) {
      await Show.deleteMany({ movieId: movieIdStr });
    }

    // Clean up favorites and reviews
    const Favorite = require('../models/favoriteModel');
    const Review = require('../models/reviewModel');
    await Promise.allSettled([
      Favorite.deleteMany({ movieId: movieIdStr }),
      Review.deleteMany({ movieId: movieIdStr }),
    ]);

    // If the movie has a tmdbId, mark it inactive so TMDB sync won't recreate it on the next fetch
    if (movie.tmdbId) {
      movie.isActive = false;
      await movie.save();
    } else {
      // Custom movie added by admin without TMDB ID: hard delete
      await Movie.findByIdAndDelete(id);
    }

    clearMovieCache();
    res.json({
      success: true,
      message: `Movie "${movie.movieName}" deleted successfully.`,
      movieId: movie._id,
    });
  } catch (err) {
    console.error('deleteMovie error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllMovies,
  getFeaturedMovies,
  getNowPlaying,
  getPopular,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
};
