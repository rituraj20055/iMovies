const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId:        { type: Number, index: true, sparse: true },
  movieName:     { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  description:   { type: String, required: true, trim: true, minlength: 10 },
  genres:        { type: [String], required: true, validate: { validator: v => v.length >= 1, message: 'At least one genre required' } },
  releaseDate:   { type: Date, required: true },
  language:      { type: String, required: true },
  duration:      { type: String, required: true },
  certification: { type: String, default: 'U/A' },
  poster:        { type: String, default: '' },
  backdrop:      { type: String, default: '' },
  trailer:       { type: String, default: '' },
  cast:          { type: [String], default: [] },
  director:      { type: String, default: '' },
  rating:        { type: Number, default: 0 },
  voteCount:     { type: Number, default: 0 },
  tagline:       { type: String, default: '' },
  isActive:      { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
