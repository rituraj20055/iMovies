const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId:    { type: String, unique: true, sparse: true },
  orderId:      { type: String, required: true },
  bookingId:    { type: String, required: true },
  userEmail:    { type: String, required: true },
  amount:       { type: Number, required: true },
  currency:     { type: String, default: 'INR' },
  status:       { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded'], default: 'created' },
  method:       { type: String },
  signature:    { type: String },
  refundId:     { type: String },
  refundAmount: { type: Number, default: 0 },
  rawResponse:  { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
