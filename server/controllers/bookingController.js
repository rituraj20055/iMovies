const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const { v4: uuidv4 } = require('uuid');
const { sendBookingConfirmation } = require('../utils/mailer');

const lockSeats = async (req, res) => {
  try {
    const { showId } = req.body;
    const selectedSeats = req.body.selectedSeats || req.body.seats || [];
    const userEmail = req.body.userEmail || req.user?.email || 'guest';

    const isObjId = mongoose.isValidObjectId(showId);
    const show = await Show.findOne({
      $or: [{ showId }, ...(isObjId ? [{ _id: showId }] : [])]
    });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const tickets = show.tickets || {};
    const now = Date.now();

    for (const seat of selectedSeats) {
      if (tickets[seat]) {
        if (tickets[seat].status === 'booked') {
          return res.status(409).json({ success: false, message: `Seat ${seat} is not available.` });
        }
        if (tickets[seat].status === 'locked' && tickets[seat].lockedBy !== userEmail) {
          const lockTime = new Date(tickets[seat].lockedAt).getTime();
          if (now - lockTime < 10 * 60 * 1000) {
            return res.status(409).json({ success: false, message: `Seat ${seat} is temporarily locked.` });
          }
        }
      }
    }

    selectedSeats.forEach(seat => {
      tickets[seat] = {
        ...(tickets[seat] || {}),
        status: 'locked',
        lockedBy: userEmail,
        lockedAt: new Date()
      };
    });

    show.tickets = tickets;
    show.markModified('tickets');
    await show.save();

    // Broadcast socket
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat-update', {
        showId: show.showId,
        type: 'SEATS_LOCKED',
        seats: selectedSeats,
        userEmail
      });
      io.to(show.showId).emit('seats-changed', {
        showId: show.showId,
        updates: tickets
      });
    }

    res.json({ success: true, message: 'Seats locked for 10 minutes.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const { showId } = req.body;
    const userEmail = req.body.userEmail || req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, message: 'User email required.' });

    const selectedSeats = req.body.selectedSeats || req.body.seats || [];
    if (selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one seat must be selected.' });
    }

    const isObjId = mongoose.isValidObjectId(showId);
    const show = await Show.findOne({
      $or: [{ showId }, ...(isObjId ? [{ _id: showId }] : [])]
    });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const bookingId = `BK${Date.now()}`;
    const tickets = show.tickets || {};

    let totalAmount = req.body.totalAmount;
    let ticketsData = req.body.ticketsData || {};

    if (!totalAmount) {
      totalAmount = 0;
      selectedSeats.forEach(seat => {
        const t = tickets[seat] || {};
        totalAmount += t.price || 200;
        ticketsData[seat] = t;
      });
    }

    selectedSeats.forEach(seat => {
      tickets[seat] = {
        ...(tickets[seat] || {}),
        status: 'booked',
        bookedBy: userEmail,
        bookingId
      };
    });

    show.tickets = tickets;
    show.markModified('tickets');
    await show.save();

    const movie = await Movie.findById(show.movieId).catch(() => null);
    const booking = await Booking.create({
      bookingId,
      userEmail,
      showId: show.showId,
      movieId: show.movieId,
      theatreName: show.theatreName,
      showDate: show.showDate,
      showTime: show.showTime,
      ticketsData,
      selectedSeats,
      totalAmount,
      paymentStatus: 'Completed'
    });

    // Broadcast socket update
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat-update', {
        showId: show.showId,
        type: 'SEATS_BOOKED',
        seats: selectedSeats,
        bookingId
      });
      io.to(show.showId).emit('seats-changed', {
        showId: show.showId,
        updates: tickets
      });
    }

    // Send confirmation email (non-blocking)
    sendBookingConfirmation(userEmail, {
      bookingId,
      movieName: movie ? movie.movieName : 'Movie',
      theatreName: show.theatreName,
      showDate: show.showDate,
      showTime: show.showTime,
      selectedSeats,
      totalAmount
    }).catch(() => {});

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userEmail = req.params.userEmail || req.user?.email;
    if (!userEmail) return res.status(400).json({ success: false, message: 'User email is required.' });
    const bookings = await Booking.find({ userEmail }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      { paymentStatus: 'Cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Release seats
    const show = await Show.findOne({ showId: booking.showId });
    if (show) {
      const tickets = show.tickets || {};
      booking.selectedSeats.forEach(seat => {
        if (tickets[seat]) {
          tickets[seat] = {
            ...tickets[seat],
            status: 'available',
            bookedBy: null,
            bookingId: null
          };
        }
      });
      show.tickets = tickets;
      show.markModified('tickets');
      await show.save();

      const io = req.app.get('io');
      if (io) {
        io.to(show.showId).emit('seat-update', {
          showId: show.showId,
          type: 'SEATS_RELEASED',
          seats: booking.selectedSeats
        });
        io.to(show.showId).emit('seats-changed', {
          showId: show.showId,
          updates: tickets
        });
      }
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { lockSeats, createBooking, getUserBookings, getAllBookings, cancelBooking };
