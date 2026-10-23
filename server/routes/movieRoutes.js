const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getFeaturedMovies,
  getNowPlaying,
  getPopular,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { fetchAdmin } = require('../middlewares/fetchUser');

// Public endpoints for browsing live TMDB market movies
router.get('/', getAllMovies);
router.get('/featured', getFeaturedMovies);
router.get('/now-playing', getNowPlaying);
router.get('/popular', getPopular);
router.get('/:id', getMovieById);

// Admin-only management endpoints
router.post('/', fetchAdmin, addMovie);
router.put('/:id', fetchAdmin, updateMovie);
router.delete('/:id', fetchAdmin, deleteMovie);

module.exports = router;
