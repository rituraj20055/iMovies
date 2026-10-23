const express = require('express');
const router = express.Router();
const { lockSeats, createBooking, getUserBookings, getAllBookings, cancelBooking } = require('../controllers/bookingController');
const { fetchUser, fetchAdmin } = require('../middlewares/fetchUser');

router.post('/lock', fetchUser, lockSeats);
router.post('/', fetchUser, createBooking);
router.get('/user', fetchUser, getUserBookings);
router.get('/user/:userEmail', fetchUser, getUserBookings);
router.get('/admin/all', fetchAdmin, getAllBookings);
router.get('/all', fetchAdmin, getAllBookings);
router.put('/cancel/:bookingId', fetchUser, cancelBooking);

module.exports = router;
