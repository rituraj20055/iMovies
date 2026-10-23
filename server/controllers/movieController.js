const Movie = require('../models/movieModel');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Favorite = require('../models/favoriteModel');
const Review = require('../models/reviewModel');
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

/**
 * GET /api/movie
 * Fetches real-time market movies from TMDB (with support for search, genre, language filters)
 * and synchronizes them to MongoDB for full booking capability.
 */
const getAllMovies = async (req, res) => {
  try {
    const { genre, language, search, page } = req.query;
    const rawMovies = await tmdbService.getLiveMarketMovies({
      page: page ? Number(page) : 1,
      search: search || '',
      genre: genre || '',
      language: language || '',
    });
    const movies = deduplicateList(rawMovies);
    res.json({ success: true, count: movies.length, movies });
  } catch (err) {
    console.error('getAllMovies error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/featured
 * Fetches top trending/popular market movies from TMDB with strict deduplication
 */
const getFeaturedMovies = async (req, res) => {
  try {
    const rawMovies = await tmdbService.getLiveMarketMovies({ page: 1 });
    const movies = deduplicateList(rawMovies);
    res.json({ success: true, count: Math.min(movies.length, 8), movies: movies.slice(0, 8) });
  } catch (err) {
    console.error('getFeaturedMovies error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/now-playing
 * Explicit endpoint for live now-playing market releases
 */
const getNowPlaying = async (req, res) => {
  try {
    const rawList = await tmdbService.fetchNowPlayingFromTMDB(Number(req.query.page) || 1);
    const synced = await tmdbService.syncTMDBMoviesToDatabase(rawList.slice(0, 20), false);
    const movies = deduplicateList(synced);
    res.json({ success: true, count: movies.length, movies });
  } catch (err) {
    console.error('getNowPlaying error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/popular
 * Explicit endpoint for live popular market releases
 */
const getPopular = async (req, res) => {
  try {
    const rawList = await tmdbService.fetchPopularFromTMDB(Number(req.query.page) || 1);
    const synced = await tmdbService.syncTMDBMoviesToDatabase(rawList.slice(0, 20), false);
    const movies = deduplicateList(synced);
    res.json({ success: true, count: movies.length, movies });
  } catch (err) {
    console.error('getPopular error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/movie/:id
 * Fetches movie by MongoDB ID or TMDB ID (with on-demand live TMDB enrichment)
 */
const getMovieById = async (req, res) => {
  try {
    const movie = await tmdbService.getOrFetchMovie(req.params.id);
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
      return res.status(201).json({ success: true, movie: existing, updated: true });
    }

    const movie = await Movie.create(data);
    await tmdbService.ensureShowsForMovie(movie);
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
    res.json({ success: true, movie });
  } catch (err) {
    console.error('updateMovie error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    // Check if there are existing bookings associated with this movie
    const bookingCount = await Booking.countDocuments({
      $or: [{ movieId: movieId }, { movieId: String(movie._id) }]
    });

    if (bookingCount > 0) {
      // Soft-delete / Archive pattern: protect financial and booking history records
      movie.isActive = false;
      await movie.save();

      // Deactivate scheduled shows for this movie to prevent new bookings
      await Show.updateMany(
        { $or: [{ movieId: movieId }, { movieId: String(movie._id) }] },
        { $set: { isActive: false } }
      );

      return res.json({
        success: true,
        message: `Movie "${movie.movieName}" has ${bookingCount} existing booking(s). It was safely archived from the active catalogue to preserve historical booking records.`,
        archived: true,
      });
    }

    // No existing bookings: safe to completely remove
    await Movie.findByIdAndDelete(movieId);

    // Clean up empty shows, favorites, and reviews
    await Show.deleteMany({ $or: [{ movieId: movieId }, { movieId: String(movie._id) }] });
    await Favorite.deleteMany({ movieId: movieId });
    await Review.deleteMany({ movieId: movieId });

    res.json({
      success: true,
      message: `Movie "${movie.movieName}" deleted successfully.`,
    });
  } catch (err) {
    console.error('deleteMovie error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to delete movie.' });
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
