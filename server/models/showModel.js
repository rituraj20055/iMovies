const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  adminEmail:  { type: String, required: true },
  showId:      { type: String, required: true, unique: true },
  movieId:     { type: String, required: true },
  movieName:   { type: String, default: '' },
  theatreName: { type: String, required: true },
  theatreId:   { type: String, required: true },
  showDate:    { type: String, required: true },
  showTime:    { type: String, required: true },
  tickets:     { type: Object, default: {} },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);
