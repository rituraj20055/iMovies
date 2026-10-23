/**
 * @file fetchAdmin.js
 * @description Express middleware to authenticate admin users via JWT.
 *
 * Extends the user JWT strategy by additionally verifying that the decoded
 * token belongs to a registered Admin document in MongoDB.  This double-check
 * prevents a valid user JWT from being used on admin-only endpoints.
 *
 * Accepts the token from either:
 *  1. `Authorization: Bearer <token>` header  (preferred)
 *  2. `auth-token: <token>` header             (legacy fallback)
 *
 * On success, attaches the Admin document to `req.admin` and calls next().
 */

import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

/**
 * fetchAdmin middleware
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchAdmin = async (req, res, next) => {
  let token = null;

  // ── 1. Try `Authorization: Bearer <token>` header ──────────────────────
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // ── 2. Fall back to legacy `auth-token` header ──────────────────────────
  if (!token && req.headers['auth-token']) {
    token = req.headers['auth-token'];
  }

  // ── 3. Reject if no token found ─────────────────────────────────────────
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  // ── 4. Verify token integrity and expiry ────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  // ── 5. Confirm the token holder exists in the Admin collection ──────────
  try {
    // The JWT payload is expected to contain `email` (set during admin login).
    const admin = await Admin.findOne({ email: decoded.email }).select('-password');

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin account not found.',
      });
    }

    // Attach decoded JWT payload and full admin document for downstream use.
    req.user  = decoded; // { id, email, username, isSuperAdmin, iat, exp }
    req.admin = admin;   // Full Mongoose Admin document (password excluded)
    next();
  } catch (err) {
    console.error('[fetchAdmin] Database lookup error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

export default fetchAdmin;
export { fetchAdmin };
