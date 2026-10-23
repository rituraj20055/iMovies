const dayjs = require('dayjs');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');
const { sendReminder } = require('./mailer');

const sendShowReminders = async () => {
  try {
    const now = dayjs();
    const shows = await Show.find({ isActive: true });
    for (const show of shows) {
      const showDateTime = dayjs(`${show.showDate} ${show.showTime}`, 'YYYY-MM-DD HH:mm');
      const diffMinutes = showDateTime.diff(now, 'minute');
      if (diffMinutes >= 115 && diffMinutes <= 125) {
        const bookings = await Booking.find({ showId: show.showId, paymentStatus: 'Completed' });
        const movie = await Movie.findById(show.movieId).catch(() => null);
        for (const booking of bookings) {
          await sendReminder(booking.userEmail, {
            movieName: movie ? movie.movieName : 'Your Movie',
            theatreName: show.theatreName,
            showTime: show.showTime
          });
        }
      }
    }
  } catch (err) {
    console.error('Reminder service error:', err.message);
  }
};

module.exports = { sendShowReminders };
