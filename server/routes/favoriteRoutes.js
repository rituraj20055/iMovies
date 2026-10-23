const express = require('express');
const router = express.Router();
const { getFavorites, checkFavorite, addFavorite, removeFavorite } = require('../controllers/favoriteController');
const { fetchUser } = require('../middlewares/fetchUser');

router.get('/', fetchUser, getFavorites);
router.get('/check/:movieId', fetchUser, checkFavorite);
router.get('/:userEmail', fetchUser, getFavorites);
router.post('/', fetchUser, addFavorite);
router.delete('/:movieId', fetchUser, removeFavorite);
router.delete('/', fetchUser, removeFavorite);

module.exports = router;
