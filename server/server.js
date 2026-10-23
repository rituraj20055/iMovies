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

// ─── Dynamic CORS Configuration (Supports Vercel, Localhost & Custom Domains) ─
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Allow localhost and local IP addresses
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel production and preview deployments
    if (/^https:\/\/.*\.vercel\.app$/.test(origin) || origin === 'https://vercel.app') {
      return callback(null, true);
    }

    // Allow explicitly configured CLIENT_URL (supports comma-separated list)
    if (process.env.CLIENT_URL) {
      const allowed = process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/+$/, ''));
      if (allowed.some((u) => origin === u || origin.startsWith(u))) {
        return callback(null, true);
      }
    }

    // Permissive fallback so production Vercel branches are never blocked
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'auth-token', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['auth-token'],
};

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: corsOptions,
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
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

// ─── API Routes (Standard /api prefix) ─────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/movie',    movieRoutes);
app.use('/api/theatre',  theatreRoutes);
app.use('/api/shows',    showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/review',   reviewRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/admin',    adminRoutes);

// ─── Compatibility Aliases (Without /api prefix) ──────────────────────────────
app.use('/auth',     authRoutes);
app.use('/movie',    movieRoutes);
app.use('/theatre',  theatreRoutes);
app.use('/shows',    showRoutes);
app.use('/bookings', bookingRoutes);
app.use('/favorite', favoriteRoutes);
app.use('/review',   reviewRoutes);
app.use('/payment',  paymentRoutes);
app.use('/admin',    adminRoutes);

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
