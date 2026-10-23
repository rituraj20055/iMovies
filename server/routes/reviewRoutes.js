const express = require('express');
const router = express.Router();
const { getMovieReviews, getMovieRating, addReview, deleteReview } = require('../controllers/reviewController');
const { fetchUser } = require('../middlewares/fetchUser');

router.get('/movie/:movieId/rating', getMovieRating);
router.get('/movie/:movieId', getMovieReviews);
router.get('/:movieId', getMovieReviews);
router.post('/', fetchUser, addReview);
router.delete('/:id', fetchUser, deleteReview);

module.exports = router;
