/**
 * emailService.js
 * Unified email sending service for iMovies (ES Modules).
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'no-reply@imovies.com',
    pass: process.env.EMAIL_PASS || 'dummy-pass',
  },
});

const isEmailConfigured = () => {
  return (
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your_email@gmail.com'
  );
};

export const sendBookingConfirmationEmail = async ({ to, userEmail, booking, show, movie, theatre }) => {
  const recipient = to || userEmail || booking?.userEmail;
  if (!recipient) return;

  const movieTitle = movie?.movieName || booking?.movieName || 'Movie';
  const theatreName = theatre?.theatreName || booking?.theatreName || 'Cinema';
  const showDate = booking?.showDate || show?.showDate || 'Today';
  const showTime = booking?.showTime || show?.showTime || '07:00 PM';
  const seats = (booking?.selectedSeats || []).join(', ');
  const amount = booking?.totalAmount || 0;
  const bookingId = booking?.bookingId || 'IM-BOOKING';

  console.log(`[EmailService] Preparing confirmation email for ${recipient} (Booking ${bookingId})`);

  if (!isEmailConfigured()) {
    console.log(`[EmailService] Email credentials not configured. Skipping SMTP send. Booking ${bookingId} confirmed.`);
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 24px; border-radius: 8px;">
      <h1 style="color: #e50914; margin-bottom: 8px;">iMovies - Booking Confirmed! 🍿</h1>
      <p style="color: #b3b3b3;">Your movie ticket reservation has been successfully confirmed.</p>
      <div style="background-color: #1a1a1a; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e50914;">
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Movie:</strong> ${movieTitle}</p>
        <p><strong>Theatre:</strong> ${theatreName}</p>
        <p><strong>Date & Time:</strong> ${showDate} at ${showTime}</p>
        <p><strong>Seats:</strong> ${seats}</p>
        <p><strong>Amount Paid:</strong> ₹${amount}</p>
      </div>
      <p style="color: #888888; font-size: 12px;">Please show your digital booking ID at the cinema entrance. Enjoy the movie!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"iMovies Cinema" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `🎬 Ticket Confirmed: ${movieTitle} (${bookingId})`,
      html,
    });
    console.log(`[EmailService] Booking confirmation email sent to ${recipient}`);
  } catch (err) {
    console.warn(`[EmailService] Failed to send email via SMTP: ${err.message}`);
  }
};

export const sendBookingReminderEmail = async ({ booking }) => {
  const recipient = booking?.userEmail;
  if (!recipient) return;

  if (!isEmailConfigured()) {
    console.log(`[EmailService] Email not configured. Skipping reminder for ${booking.bookingId}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"iMovies Cinema" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `⏰ Reminder: Your show for ${booking.movieName || 'your movie'} starts soon!`,
      html: `
        <div style="background-color:#0d0d0d;color:#fff;padding:20px;font-family:sans-serif;">
          <h2 style="color:#e50914;">Showtime Reminder!</h2>
          <p>Your show at <strong>${booking.theatreName}</strong> begins in under 2 hours.</p>
          <p>Seats: <strong>${(booking.selectedSeats || []).join(', ')}</strong></p>
          <p>Please arrive 15 minutes before showtime.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn(`[EmailService] Failed to send reminder email: ${err.message}`);
  }
};

export const sendReminderEmail = sendBookingReminderEmail;

export const sendCancellationEmail = async ({ to, userEmail, booking }) => {
  const recipient = to || userEmail || booking?.userEmail;
  if (!recipient) return;

  if (!isEmailConfigured()) {
    console.log(`[EmailService] Email not configured. Skipping cancellation email for ${booking?.bookingId}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"iMovies Cinema" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `❌ Booking Cancelled: ${booking?.bookingId}`,
      html: `
        <div style="background-color:#0d0d0d;color:#fff;padding:20px;font-family:sans-serif;">
          <h2 style="color:#dc3545;">Booking Cancelled</h2>
          <p>Your booking <strong>${booking?.bookingId}</strong> has been cancelled and refunded.</p>
          <p>Refund Amount: ₹${booking?.totalAmount || 0}</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn(`[EmailService] Failed to send cancellation email: ${err.message}`);
  }
};

export default {
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendReminderEmail,
  sendCancellationEmail,
};
