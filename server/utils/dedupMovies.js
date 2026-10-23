const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const Favorite = require('../models/favoriteModel');
const Review = require('../models/reviewModel');

/**
 * Normalizes movie titles for comparison:
 * Trims surrounding whitespace and converts to lower case.
 */
const normalizeTitle = (title) => {
  if (!title || typeof title !== 'string') return '';
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Deduplicates the Movie collection in MongoDB.
 * Finds all movies sharing the same normalized title (or tmdbId).
 * Keeps the primary record (the one with TMDB ID or older created date),
 * updates any referencing Shows, Bookings, Favorites, and Reviews to point to the primary ID,
 * and deletes the redundant duplicate movie records.
 */
const deduplicateDatabaseMovies = async () => {
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: 1 });
    if (!allMovies || allMovies.length === 0) return { removedCount: 0 };

    const seenByTitle = new Map();
    const seenByTmdbId = new Map();
    const duplicateIds = new Set();
    const migrationMap = new Map(); // duplicateId -> primaryId

    for (const movie of allMovies) {
      const normTitle = normalizeTitle(movie.movieName);
      const tmdbId = movie.tmdbId;

      let primaryMovie = null;

      if (normTitle && seenByTitle.has(normTitle)) {
        primaryMovie = seenByTitle.get(normTitle);
      } else if (tmdbId && seenByTmdbId.has(tmdbId)) {
        primaryMovie = seenByTmdbId.get(tmdbId);
      }

      if (primaryMovie && primaryMovie._id.toString() !== movie._id.toString()) {
        // This is a duplicate record
        duplicateIds.add(movie._id.toString());
        migrationMap.set(movie._id.toString(), primaryMovie._id.toString());
        console.log(`🧹 Found duplicate movie "${movie.movieName}" (ID: ${movie._id}). Consolidating into primary (ID: ${primaryMovie._id})`);
      } else {
        // Register as primary for this title & tmdbId
        if (normTitle) seenByTitle.set(normTitle, movie);
        if (tmdbId) seenByTmdbId.set(tmdbId, movie);
      }
    }

    if (duplicateIds.size > 0) {
      console.log(`🔄 Migrating foreign keys for ${duplicateIds.size} duplicate movie record(s)...`);

      for (const [dupId, primId] of migrationMap.entries()) {
        // Update shows referencing the duplicate
        await Show.updateMany({ movieId: dupId }, { $set: { movieId: primId } });

        // Update bookings referencing the duplicate
        await Booking.updateMany({ movieId: dupId }, { $set: { movieId: primId } });

        // Update favorites referencing the duplicate
        await Favorite.updateMany({ movieId: dupId }, { $set: { movieId: primId } });

        // Update reviews referencing the duplicate
        await Review.updateMany({ movieId: dupId }, { $set: { movieId: primId } });

        // Safely delete duplicate movie document
        await Movie.findByIdAndDelete(dupId);
      }

      console.log(`✅ Successfully eliminated ${duplicateIds.size} duplicate movie(s) from MongoDB!`);
    }

    return { removedCount: duplicateIds.size };
  } catch (err) {
    console.error('Error during database movie deduplication:', err.message);
    return { error: err.message };
  }
};

module.exports = { normalizeTitle, deduplicateDatabaseMovies };
