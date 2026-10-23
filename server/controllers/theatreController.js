const mongoose = require('mongoose');
const Theatre = require('../models/theatreModel');
const { v4: uuidv4 } = require('uuid');

const generateSeatLayout = (rows, cols) => {
  const seats = {};
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const seatId = `${rowLabels[r]}${c}`;
      seats[seatId] = { status: 'available' };
    }
  }
  return seats;
};

const getAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find({});
    res.json({ success: true, theatres });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTheatreById = async (req, res) => {
  try {
    const isObjId = mongoose.isValidObjectId(req.params.id);
    const theatre = await Theatre.findOne(
      isObjId ? { $or: [{ theatreId: req.params.id }, { _id: req.params.id }] } : { theatreId: req.params.id }
    );
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });
    res.json({ success: true, theatre });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addTheatre = async (req, res) => {
  try {
    const data = { ...req.body, theatreId: req.body.theatreId || uuidv4() };
    if (!data.adminEmail) data.adminEmail = req.user?.email || 'admin@imovies.com';
    // Generate seat layouts if not provided
    if (!data.balconySeats || Object.keys(data.balconySeats).length === 0) data.balconySeats = generateSeatLayout(2, 10);
    if (!data.middleSeats  || Object.keys(data.middleSeats).length  === 0) data.middleSeats  = generateSeatLayout(4, 10);
    if (!data.lowerSeats   || Object.keys(data.lowerSeats).length   === 0) data.lowerSeats   = generateSeatLayout(4, 10);
    const theatre = await Theatre.create(data);
    res.status(201).json({ success: true, theatre });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateTheatre = async (req, res) => {
  try {
    const isObjId = mongoose.isValidObjectId(req.params.id);
    const filter = isObjId ? { $or: [{ theatreId: req.params.id }, { _id: req.params.id }] } : { theatreId: req.params.id };
    const theatre = await Theatre.findOneAndUpdate(filter, req.body, { new: true });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });
    res.json({ success: true, theatre });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteTheatre = async (req, res) => {
  try {
    const isObjId = mongoose.isValidObjectId(req.params.id);
    const filter = isObjId ? { $or: [{ theatreId: req.params.id }, { _id: req.params.id }] } : { theatreId: req.params.id };
    const theatre = await Theatre.findOneAndDelete(filter);
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });
    res.json({ success: true, message: 'Theatre deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllTheatres, getTheatreById, addTheatre, updateTheatre, deleteTheatre };
