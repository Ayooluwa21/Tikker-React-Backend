const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createBooking, getMyBookings } = require('../controllers/bookingController');

router.post('/', auth, createBooking);
router.get('/my-bookings', auth, getMyBookings);

module.exports = router;
