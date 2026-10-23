const Favorite = require('../models/favoriteModel');
const Movie = require('../models/movieModel');

const getFavorites = async (req, res) => {
  try {
    const userEmail = req.params.userEmail || req.user?.email;
    if (!userEmail) return res.status(400).json({ success: false, message: 'User email required.' });

    const favorites = await Favorite.find({ userEmail }).sort({ createdAt: -1 });

    // Populate movie details
    const populated = await Promise.all(
      favorites.map(async (fav) => {
        const movie = await Movie.findById(fav.movieId).catch(() => null);
        return {
          _id: fav._id,
          userEmail: fav.userEmail,
          movieId: movie || { _id: fav.movieId },
          createdAt: fav.createdAt
        };
      })
    );

    res.json({ success: true, favorites: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { movieId } = req.params;
    if (!userEmail) return res.json({ success: true, isFavorite: false });
    const fav = await Favorite.findOne({ userEmail, movieId });
    res.json({ success: true, isFavorite: !!fav });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userEmail = req.body.userEmail || req.user?.email;
    const movieId = req.body.movieId;
    if (!userEmail || !movieId) return res.status(400).json({ success: false, message: 'User email and movieId required.' });

    const existing = await Favorite.findOne({ userEmail, movieId });
    if (existing) return res.status(200).json({ success: true, favorite: existing, message: 'Already in favorites.' });

    const fav = await Favorite.create({ userEmail, movieId });
    res.status(201).json({ success: true, favorite: fav });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userEmail = req.body.userEmail || req.user?.email;
    const movieId = req.params.movieId || req.body.movieId;
    if (!userEmail || !movieId) return res.status(400).json({ success: false, message: 'User email and movieId required.' });

    await Favorite.findOneAndDelete({ userEmail, movieId });
    res.json({ success: true, message: 'Removed from favorites.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFavorites, checkFavorite, addFavorite, removeFavorite };
