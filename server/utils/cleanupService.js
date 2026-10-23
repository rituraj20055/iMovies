const Show = require('../models/showModel');

const releaseExpiredLocks = async () => {
  try {
    const now = Date.now();
    const shows = await Show.find({});
    for (const show of shows) {
      let modified = false;
      const tickets = show.tickets || {};
      for (const seatId of Object.keys(tickets)) {
        const seat = tickets[seatId];
        if (seat.status === 'locked' && seat.lockedAt && (now - new Date(seat.lockedAt).getTime()) > 10 * 60 * 1000) {
          tickets[seatId] = { status: 'available' };
          modified = true;
        }
      }
      if (modified) {
        show.tickets = tickets;
        show.markModified('tickets');
        await show.save();
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
};

module.exports = { releaseExpiredLocks };
