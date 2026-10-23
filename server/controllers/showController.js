const mongoose = require('mongoose');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');
const { v4: uuidv4 } = require('uuid');

const buildInitialTickets = (theatre) => {
  const tickets = {};
  const buildSection = (seats, tier, price) => {
    Object.keys(seats).forEach(seatId => {
      tickets[`${tier}_${seatId}`] = { status: 'available', tier, price, seatId };
    });
  };
  buildSection(theatre.balconySeats || {}, 'balcony', theatre.balconySeatPrice || 350);
  buildSection(theatre.middleSeats || {},  'middle',  theatre.middleSeatPrice || 250);
  buildSection(theatre.lowerSeats || {},   'lower',   theatre.lowerSeatPrice || 150);
  return tickets;
};

const getAllShows = async (req, res) => {
  try {
    const { movieId } = req.query;
    const filter = movieId ? { movieId } : {};
    const shows = await Show.find(filter).sort({ showDate: 1, showTime: 1 });
    res.json({ success: true, shows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getShowsByMovieId = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date } = req.query;
    const filter = { movieId };
    if (date) {
      filter.showDate = date;
    }
    const shows = await Show.find(filter).sort({ showDate: 1, showTime: 1 });
    res.json({ success: true, shows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getShowById = async (req, res) => {
  try {
    const param = req.params.id;
    const isObjId = mongoose.isValidObjectId(param);
    const show = await Show.findOne({
      $or: [
        { showId: param },
        ...(isObjId ? [{ _id: param }] : [])
      ]
    });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    // Attach movie & theatre details if available for frontend convenience
    const movie = await Movie.findById(show.movieId).catch(() => null);
    const theatre = await Theatre.findOne({
      $or: [{ theatreId: show.theatreId }, { theatreName: show.theatreName }]
    }).catch(() => null);

    const showObj = show.toObject();
    if (movie) showObj.movie = movie;
    if (theatre) showObj.theatre = theatre;

    res.json({ success: true, show: showObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const lockSeats = async (req, res) => {
  try {
    const { showId } = req.body;
    const seats = req.body.seats || req.body.selectedSeats || [];
    const userEmail = req.body.userEmail || req.user?.email || 'guest';

    const isObjId = mongoose.isValidObjectId(showId);
    const show = await Show.findOne({
      $or: [
        { showId },
        ...(isObjId ? [{ _id: showId }] : [])
      ]
    });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const tickets = show.tickets || {};
    const now = Date.now();

    for (const seat of seats) {
      const current = tickets[seat];
      if (current) {
        if (current.status === 'booked') {
          return res.status(409).json({ success: false, message: `Seat ${seat} is already booked.` });
        }
        if (current.status === 'locked' && current.lockedBy !== userEmail) {
          // Check if lock expired (> 10 mins)
          const lockTime = new Date(current.lockedAt).getTime();
          if (now - lockTime < 10 * 60 * 1000) {
            return res.status(409).json({ success: false, message: `Seat ${seat} is temporarily locked by another user.` });
          }
        }
      }
    }

    seats.forEach(seat => {
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

    // Broadcast socket update
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat-update', {
        showId: show.showId,
        type: 'SEATS_LOCKED',
        seats,
        userEmail
      });
      io.to(show.showId).emit('seats-changed', {
        showId: show.showId,
        updates: tickets
      });
    }

    res.json({ success: true, message: 'Seats locked for 10 minutes.', tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const releaseLocks = async (req, res) => {
  try {
    const { showId } = req.body;
    const seats = req.body.seats || req.body.selectedSeats || [];
    const userEmail = req.body.userEmail || req.user?.email;

    const isObjId = mongoose.isValidObjectId(showId);
    const show = await Show.findOne({
      $or: [
        { showId },
        ...(isObjId ? [{ _id: showId }] : [])
      ]
    });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const tickets = show.tickets || {};
    seats.forEach(seat => {
      if (tickets[seat] && tickets[seat].status === 'locked') {
        if (!userEmail || tickets[seat].lockedBy === userEmail) {
          tickets[seat] = {
            ...tickets[seat],
            status: 'available',
            lockedBy: null,
            lockedAt: null
          };
        }
      }
    });

    show.tickets = tickets;
    show.markModified('tickets');
    await show.save();

    // Broadcast socket update
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seat-update', {
        showId: show.showId,
        type: 'SEATS_RELEASED',
        seats
      });
      io.to(show.showId).emit('seats-changed', {
        showId: show.showId,
        updates: tickets
      });
    }

    res.json({ success: true, message: 'Seats released.', tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addShow = async (req, res) => {
  try {
    const { theatreId, movieId, showDate, showTime } = req.body;
    if (!theatreId || !movieId || !showDate || !showTime) {
      return res.status(400).json({ success: false, message: 'Movie, theatre, show date, and show time are required.' });
    }

    const theatre = await Theatre.findOne({
      $or: [{ theatreId }, { theatreName: req.body.theatreName }]
    });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    // Look up movie to store movieName snapshot
    const isObjId = mongoose.isValidObjectId(movieId);
    const movie = await Movie.findOne({
      $or: [
        ...(isObjId ? [{ _id: movieId }] : []),
        { tmdbId: Number(movieId) || -1 },
      ]
    }).catch(() => null);

    const movieName = req.body.movieName || movie?.movieName || movie?.name || 'Feature Film';

    const tickets = buildInitialTickets(theatre);
    if (req.body.ticketPrice && Number(req.body.ticketPrice) > 0) {
      const customP = Number(req.body.ticketPrice);
      Object.keys(tickets).forEach((seatKey) => {
        if (tickets[seatKey].tier === 'middle') tickets[seatKey].price = customP;
        else if (tickets[seatKey].tier === 'balcony') tickets[seatKey].price = Math.round(customP * 1.3);
        else if (tickets[seatKey].tier === 'lower') tickets[seatKey].price = Math.round(customP * 0.75);
      });
    }

    const adminEmail = req.body.adminEmail || req.user?.email || 'admin@imovies.com';

    const show = await Show.create({
      ...req.body,
      adminEmail,
      showId: uuidv4(),
      movieId: String(movie?._id || movieId),
      movieName,
      theatreId: theatre.theatreId,
      theatreName: theatre.theatreName,
      showDate,
      showTime,
      tickets,
      isActive: true,
    });

    res.status(201).json({ success: true, show });
  } catch (err) {
    console.error('addShow error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateShow = async (req, res) => {
  try {
    const show = await Show.findOneAndUpdate({ showId: req.params.id }, req.body, { new: true });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });
    res.json({ success: true, show });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteShow = async (req, res) => {
  try {
    const show = await Show.findOneAndDelete({
      $or: [{ showId: req.params.id }, ...(mongoose.isValidObjectId(req.params.id) ? [{ _id: req.params.id }] : [])]
    });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });
    res.json({ success: true, message: 'Show deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllShows,
  getShowsByMovieId,
  getShowById,
  lockSeats,
  releaseLocks,
  addShow,
  updateShow,
  deleteShow
};
