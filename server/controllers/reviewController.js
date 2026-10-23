const Review = require('../models/reviewModel');

const getMovieReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMovieRating = async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId });
    const totalReviews = reviews.length;
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }
    res.json({ success: true, averageRating, totalReviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addReview = async (req, res) => {
  try {
    const userEmail = req.body.userEmail || req.user?.email;
    const { movieId, rating, reviewText } = req.body;
    if (!userEmail) return res.status(401).json({ success: false, message: 'User email required.' });

    const existing = await Review.findOne({ userEmail, movieId });
    if (existing) {
      const updated = await Review.findOneAndUpdate(
        { userEmail, movieId },
        { rating, reviewText },
        { new: true }
      );
      return res.json({ success: true, review: updated, message: 'Review updated.' });
    }
    const review = await Review.create({ userEmail, movieId, rating, reviewText });
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMovieReviews, getMovieRating, addReview, deleteReview };
