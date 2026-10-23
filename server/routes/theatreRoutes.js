const express = require('express');
const router = express.Router();
const { getAllTheatres, getTheatreById, addTheatre, updateTheatre, deleteTheatre } = require('../controllers/theatreController');
const { fetchAdmin } = require('../middlewares/fetchUser');

// Browsing theatres
router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);

// Admin-only theatre management
router.post('/', fetchAdmin, addTheatre);
router.put('/:id', fetchAdmin, updateTheatre);
router.delete('/:id', fetchAdmin, deleteTheatre);

module.exports = router;
