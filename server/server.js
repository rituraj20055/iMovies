const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const authRoutes     = require('./routes/authRoutes');
const movieRoutes    = require('./routes/movieRoutes');
const theatreRoutes  = require('./routes/theatreRoutes');
const showRoutes     = require('./routes/showRoutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes   = require('./routes/reviewRoutes');
const paymentRoutes  = require('./routes/paymentRoutes');
const adminRoutes    = require('./routes/adminRoutes');

const { releaseExpiredLocks } = require('./utils/cleanupService');
const { sendShowReminders }   = require('./utils/reminderService');
const { connectDB }           = require('./utils/db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('join-show', (showId) => socket.join(showId));
  socket.on('seat-update', (data) => io.to(data.showId).emit('seats-changed', data));
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
});
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/movie',    movieRoutes);
app.use('/api/theatre',  theatreRoutes);
app.use('/api/shows',    showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/review',   reviewRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/admin',    adminRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({
  success: true,
  message: 'iMovies API is running 🎬',
  dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  dbHost: mongoose.connection.host || 'unknown',
}));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Cron Jobs ────────────────────────────────────────────────────────────────
cron.schedule('*/5 * * * *',  () => { releaseExpiredLocks(); });  // Cleanup every 5 min
cron.schedule('*/10 * * * *', () => { sendShowReminders(); });    // Reminders every 10 min

// ─── Database Connection & Server Initialization ───────────────────────────────
const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    // Connect to database before accepting incoming HTTP requests
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 iMovies Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Fatal error: Server startup aborted due to database connection failure:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io, server };
