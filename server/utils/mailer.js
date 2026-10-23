const nodemailer = require('nodemailer');

const isMailConfigured =
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_PASS !== 'your_app_password_here' &&
  !process.env.EMAIL_PASS.includes('placeholder');

let transporter = null;
if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

const sendBookingConfirmation = async (to, bookingDetails) => {
  const { movieName, theatreName, showDate, showTime, selectedSeats, totalAmount, bookingId } = bookingDetails;
  
  if (!isMailConfigured || !transporter) {
    console.log(`📧 [iMovies Notification] Booking confirmed for ${to} | ID: ${bookingId} | Movie: ${movieName} | Seats: ${selectedSeats?.join(', ')}`);
    return;
  }

  const mailOptions = {
    from: `"iMovies" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🎬 Your iMovies Booking Confirmation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:30px;border-radius:12px;">
        <h1 style="color:#e94560;text-align:center;">🎬 iMovies</h1>
        <h2 style="text-align:center;">Booking Confirmed!</h2>
        <div style="background:#16213e;padding:20px;border-radius:8px;margin:20px 0;">
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Movie:</strong> ${movieName}</p>
          <p><strong>Theatre:</strong> ${theatreName}</p>
          <p><strong>Date:</strong> ${showDate}</p>
          <p><strong>Time:</strong> ${showTime}</p>
          <p><strong>Seats:</strong> ${selectedSeats.join(', ')}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
        </div>
        <p style="text-align:center;color:#aaa;">Enjoy your movie! 🍿</p>
      </div>
    `
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error('Mail error:', e.message); }
};

const sendReminder = async (to, details) => {
  if (!isMailConfigured || !transporter) {
    console.log(`⏰ [iMovies Reminder] Show starting in 2 hours for ${to} | Movie: ${details.movieName}`);
    return;
  }

  const mailOptions = {
    from: `"iMovies" <${process.env.EMAIL_USER}>`,
    to,
    subject: '⏰ Your Movie is in 2 Hours! - iMovies Reminder',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:30px;border-radius:12px;">
        <h1 style="color:#e94560;text-align:center;">🎬 iMovies</h1>
        <h2 style="text-align:center;">⏰ Show Reminder</h2>
        <p>Your movie <strong>${details.movieName}</strong> starts in approximately 2 hours!</p>
        <p><strong>Theatre:</strong> ${details.theatreName}</p>
        <p><strong>Time:</strong> ${details.showTime}</p>
        <p>Please arrive 15 minutes early. Enjoy the show! 🍿</p>
      </div>
    `
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error('Reminder mail error:', e.message); }
};

module.exports = { sendBookingConfirmation, sendReminder };
