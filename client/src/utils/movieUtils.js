/**
 * Frontend Movie Utilities
 * Deduplication, title normalization, and section partitioning
 */

export const normalizeMovieTitle = (title) => {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Deduplicate an array of movies by both unique _id and normalized movie title.
 * Preserves original order, keeping the first occurrence.
 */
export const deduplicateMovies = (movies = []) => {
  if (!Array.isArray(movies)) return [];

  const seenIds = new Set();
  const seenTitles = new Set();
  const result = [];

  for (const movie of movies) {
    if (!movie) continue;

    // Use _id or fallback to id or title
    const id = (movie._id || movie.id || '').toString();
    const normalizedTitle = normalizeMovieTitle(movie.movieName || movie.title);

    // If ID already encountered, skip
    if (id && seenIds.has(id)) {
      continue;
    }

    // If normalized title already encountered, skip
    if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      continue;
    }

    if (id) seenIds.add(id);
    if (normalizedTitle) seenTitles.add(normalizedTitle);

    result.push(movie);
  }

  return result;
};

/**
 * Partition movies across homepage sections to prevent cross-row redundancy
 * while ensuring rich visual diversity.
 */
export const partitionHomeSections = (allMovies = [], featuredMovies = []) => {
  const cleanAll = deduplicateMovies(allMovies);
  const cleanFeatured = deduplicateMovies(featuredMovies);

  // Trending Now: top featured titles (or top rated from all)
  const trending = cleanFeatured.length > 0
    ? cleanFeatured.slice(0, 10)
    : cleanAll.slice(0, 8);

  const trendingIds = new Set(trending.map((m) => (m._id || m.id || '').toString()));

  // Now Showing: active cinema releases, prioritized to show movies not already in Trending
  // If the total catalogue is small, include others but avoid starting with identical sequence
  const remainingMovies = cleanAll.filter(
    (m) => !trendingIds.has((m._id || m.id || '').toString())
  );

  const nowShowing = remainingMovies.length >= 4
    ? remainingMovies
    : cleanAll;

  return {
    trending,
    nowShowing,
    allClean: cleanAll,
  };
};
