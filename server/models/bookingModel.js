const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId:     { type: String, required: true, unique: true },
  userEmail:     { type: String, required: true },
  showId:        { type: String, required: true },
  movieId:       { type: String, required: true },
  movieName:     { type: String },
  theatreName:   { type: String },
  theatreId:     { type: String },
  showDate:      { type: String },
  showTime:      { type: String },
  ticketsData:   { type: Object, required: true },
  selectedSeats: { type: [String], default: [] },
  totalAmount:   { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'], default: 'Pending' },
  paymentMethod: { type: String, default: 'Razorpay' },
  orderId:       { type: String },
  paymentId:     { type: String },
  signature:     { type: String },
  refundId:      { type: String },
  refundAmount:  { type: Number, default: 0 },
  refundReason:  { type: String },
  refundedAt:    { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
