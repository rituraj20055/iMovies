const express = require('express');
const router = express.Router();
const {
  getAllShows,
  getShowsByMovieId,
  getShowById,
  lockSeats,
  releaseLocks,
  addShow,
  updateShow,
  deleteShow
} = require('../controllers/showController');
const { fetchUser, fetchAdmin } = require('../middlewares/fetchUser');

// Browsing shows (public or user)
router.get('/', getAllShows);
router.get('/movie/:movieId', getShowsByMovieId);
router.get('/:id', getShowById);

// Seat locking & unlocking
router.post('/lock-seats', fetchUser, lockSeats);
router.post('/release-locks', fetchUser, releaseLocks);

// Admin show management
router.post('/', fetchAdmin, addShow);
router.put('/:id', fetchAdmin, updateShow);
router.delete('/:id', fetchAdmin, deleteShow);

module.exports = router;
