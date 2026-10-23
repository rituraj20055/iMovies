const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2024';
const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

// ─── USER AUTH ────────────────────────────────────────────────────────────────

const userRegister = async (req, res) => {
  try {
    const rawUsername = req.body.username;
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    if (!rawUsername || !rawEmail || !rawPassword) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const username = String(rawUsername).trim();
    const email = String(rawEmail).trim().toLowerCase();
    const password = String(rawPassword);

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 20 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check for existing user by normalized email or username
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
      }
      return res.status(409).json({ success: false, message: 'Username already taken. Please choose another username.' });
    }

    // Hash password with salt rounds = 12
    const hashedPassword = await bcrypt.hash(password, 12);

    // Persist user record in MongoDB
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Generate JWT token containing persisted user ID
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isAdmin: false
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to iMovies.',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: false
      }
    });
  } catch (err) {
    console.error('userRegister error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
};

const userLogin = async (req, res) => {
  try {
    const rawIdentifier = req.body.email || req.body.username || req.body.identifier;
    const rawPassword = req.body.password;

    if (!rawIdentifier || !rawPassword) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const identifier = String(rawIdentifier).trim();
    const normalizedEmail = identifier.toLowerCase();
    const password = String(rawPassword);

    // Look up user by normalized email OR case-insensitive username
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: identifier },
        { username: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password. Please check your credentials.' });
    }

    // Verify submitted password against stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password. Please check your credentials.' });
    }

    // Issue verified JWT
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isAdmin: false
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: false
      }
    });
  } catch (err) {
    console.error('userLogin error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
};

const validateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      // Check if admin token was passed
      if (req.user.isAdmin) {
        const admin = await Admin.findById(req.user.id).select('-password');
        if (admin) {
          return res.json({
            success: true,
            user: {
              id: admin._id.toString(),
              username: admin.username,
              email: admin.email,
              isAdmin: true
            }
          });
        }
      }
      return res.status(401).json({ success: false, message: 'Session expired or user not found. Please log in.' });
    }
    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: false
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────

const adminRegister = async (req, res) => {
  try {
    const rawUsername = req.body.username;
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    if (!rawUsername || !rawEmail || !rawPassword) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const username = String(rawUsername).trim();
    const email = String(rawEmail).trim().toLowerCase();
    const password = String(rawPassword);

    const exists = await Admin.findOne({
      $or: [
        { email },
        { username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Admin username or email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ username, email, password: hashed });
    const token = generateToken({ id: admin._id.toString(), email: admin.email, username: admin.username, isAdmin: true });
    return res.status(201).json({ success: true, token, admin: { id: admin._id.toString(), username: admin.username, email: admin.email, isAdmin: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const rawIdentifier = req.body.email || req.body.username || req.body.identifier;
    const rawPassword = req.body.password;

    if (!rawIdentifier || !rawPassword) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const identifier = String(rawIdentifier).trim();
    const normalizedEmail = identifier.toLowerCase();
    const password = String(rawPassword);

    const admin = await Admin.findOne({
      $or: [
        { email: normalizedEmail },
        { username: identifier },
        { username: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = generateToken({ id: admin._id.toString(), email: admin.email, username: admin.username, isAdmin: true });
    return res.json({ success: true, token, admin: { id: admin._id.toString(), username: admin.username, email: admin.email, isAdmin: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const validateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) return res.status(401).json({ success: false, message: 'Admin not found.' });
    return res.json({ success: true, admin: { id: admin._id.toString(), username: admin.username, email: admin.email, isAdmin: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN UTILITIES ──────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const Movie = require('../models/movieModel');
    const Show = require('../models/showModel');
    const Booking = require('../models/bookingModel');
    const [users, movies, shows, bookings] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Show.countDocuments(),
      Booking.find({ paymentStatus: 'Completed' })
    ]);
    const revenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    res.json({ success: true, stats: { users, movies, shows, bookings: bookings.length, revenue } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  userRegister,
  userLogin,
  validateUser,
  adminRegister,
  adminLogin,
  validateAdmin,
  getAllUsers,
  deleteUser,
  getStats
};
