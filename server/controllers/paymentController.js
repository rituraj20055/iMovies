const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const Payment = require('../models/paymentModel');
const { sendBookingConfirmation } = require('../utils/mailer');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '3p2BtSgWg8TBkaaliP31y2nm';
  return new Razorpay({ key_id, key_secret });
};

/**
 * GET /api/payment/config
 * Returns public Razorpay Key ID
 */
const getPaymentConfig = (req, res) => {
  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63',
  });
};

/**
 * POST /api/payment/create-order
 * Step 2 & 3: Creates Razorpay order & creates pending booking in MongoDB
 */
const createOrder = async (req, res) => {
  try {
    const { showId, amount } = req.body;
    const selectedSeats = req.body.selectedSeats || req.body.seats || [];
    const userEmail = req.body.userEmail || req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'User authentication required.' });
    }

    if (!showId || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and at least one seat are required.' });
    }

    // 1. Verify show exists
    const show = await Show.findOne({ showId });
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // 2. Validate seat availability
    const tickets = show.tickets || {};
    const now = Date.now();
    for (const seat of selectedSeats) {
      const current = tickets[seat];
      if (current) {
        if (current.status === 'booked') {
          return res.status(409).json({ success: false, message: `Seat ${seat} is already booked.` });
        }
        if (current.status === 'locked' && current.lockedBy && current.lockedBy !== userEmail) {
          const lockTime = new Date(current.lockedAt).getTime();
          if (now - lockTime < 10 * 60 * 1000) {
            return res.status(409).json({ success: false, message: `Seat ${seat} is temporarily locked by another user.` });
          }
        }
      }
    }

    // 3. Compute price in INR and paise
    let totalInRupees = Number(amount);
    if (!totalInRupees || isNaN(totalInRupees) || totalInRupees <= 0) {
      totalInRupees = selectedSeats.reduce((sum, s) => sum + (tickets[s]?.price || 250), 0);
    }
    const amountInPaise = Math.round(totalInRupees * 100);

    // 4. Create Razorpay order
    const razorpay = getRazorpayInstance();
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        showId: show.showId,
        userEmail,
        seats: selectedSeats.join(','),
      },
    });

    // 5. Build ticketsData snapshot
    const ticketsData = req.body.ticketsData || {};
    selectedSeats.forEach((seat) => {
      if (!ticketsData[seat]) {
        ticketsData[seat] = tickets[seat] || { tier: 'standard', price: totalInRupees / selectedSeats.length };
      }
    });

    // 6. Look up movie details for snapshot
    const movie = await Movie.findById(show.movieId).catch(() => null);
    const movieName = req.body.movieName || (movie ? movie.movieName : 'Movie');

    // 7. Create Pending Booking in MongoDB
    const bookingId = `BK${Date.now()}`;
    const booking = await Booking.create({
      bookingId,
      userEmail,
      showId: show.showId,
      movieId: show.movieId,
      movieName,
      theatreName: show.theatreName,
      theatreId: show.theatreId,
      showDate: show.showDate,
      showTime: show.showTime,
      ticketsData,
      selectedSeats,
      totalAmount: totalInRupees,
      paymentStatus: 'Pending',
      paymentMethod: 'Razorpay',
      orderId: order.id,
    });

    // 8. Create Payment record ledger
    await Payment.create({
      orderId: order.id,
      bookingId,
      userEmail,
      amount: totalInRupees,
      currency: 'INR',
      status: 'created',
      rawResponse: order,
    });

    // Return order details to frontend for Razorpay Checkout modal
    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63',
      bookingId: booking.bookingId,
      amount: totalInRupees,
    });
  } catch (err) {
    console.error('createOrder error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Error creating Razorpay order' });
  }
};

/**
 * POST /api/payment/verify
 * Step 4: Cryptographic HMAC SHA256 verification and marks booking Completed
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay verification parameters (order_id, payment_id, signature).',
      });
    }

    // 1. Cryptographic HMAC SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || '3p2BtSgWg8TBkaaliP31y2nm';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn('⚠️ Razorpay signature mismatch:', { generatedSignature, received: razorpay_signature });

      // Mark booking as Failed
      await Booking.findOneAndUpdate(
        { $or: [{ orderId: razorpay_order_id }, { bookingId }] },
        { paymentStatus: 'Failed' }
      );
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed', signature: razorpay_signature, paymentId: razorpay_payment_id }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid cryptographic signature.',
      });
    }

    // 2. Find and update the Booking to Completed
    const booking = await Booking.findOne({
      $or: [{ orderId: razorpay_order_id }, { bookingId }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking record not found.' });
    }

    booking.paymentStatus = 'Completed';
    booking.paymentId = razorpay_payment_id;
    booking.signature = razorpay_signature;
    booking.paymentMethod = req.body.paymentMethod || 'Razorpay';
    await booking.save();

    // 3. Update Show seats to 'booked'
    const show = await Show.findOne({ showId: booking.showId });
    if (show) {
      const tickets = show.tickets || {};
      booking.selectedSeats.forEach((seat) => {
        tickets[seat] = {
          ...(tickets[seat] || {}),
          status: 'booked',
          bookedBy: booking.userEmail,
          bookingId: booking.bookingId,
          paymentId: razorpay_payment_id,
        };
      });
      show.tickets = tickets;
      show.markModified('tickets');
      await show.save();

      // Emit Socket.io real-time update to all active viewing clients
      const io = req.app.get('io');
      if (io) {
        io.to(show.showId).emit('seat-update', {
          showId: show.showId,
          type: 'SEATS_BOOKED',
          seats: booking.selectedSeats,
          bookingId: booking.bookingId,
        });
        io.to(show.showId).emit('seats-changed', {
          showId: show.showId,
          updates: tickets,
        });
      }
    }

    // 4. Update Payment record to 'captured'
    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'captured',
        method: booking.paymentMethod,
        rawResponse: req.body,
      },
      { upsert: true }
    );

    // 5. Send automated confirmation email via mailer (non-blocking)
    const movie = await Movie.findById(booking.movieId).catch(() => null);
    sendBookingConfirmation(booking.userEmail, {
      bookingId: booking.bookingId,
      movieName: booking.movieName || (movie ? movie.movieName : 'Movie'),
      theatreName: booking.theatreName,
      showDate: booking.showDate,
      showTime: booking.showTime,
      selectedSeats: booking.selectedSeats,
      totalAmount: booking.totalAmount,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully! Digital ticket generated.',
      booking,
    });
  } catch (err) {
    console.error('verifyPayment error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
  }
};

module.exports = {
  getPaymentConfig,
  createOrder,
  verifyPayment,
};
