const jwt = require('jsonwebtoken');

const extractToken = (req) => {
  let token = req.header('auth-token');
  if (!token && req.header('authorization')) {
    const authHeader = req.header('authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }
  return token;
};

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2024';

const fetchUser = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const fetchAdmin = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ success: false, message: 'Admin access required.' });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = { fetchUser, fetchAdmin };
