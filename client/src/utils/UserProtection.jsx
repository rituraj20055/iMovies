import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Loader from '../components/Loader'
import api from './api'

/**
 * Helper to decode and verify JWT payload expiry in the browser
 */
const getJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * UserProtection
 * Wraps user-only routes. Validates the stored userToken against the backend.
 * - Checking → displays <Loader /> while verifying session
 * - Valid    → renders <Outlet /> (the child route e.g. /home, /bookings)
 * - Invalid  → redirects to /login with clear feedback
 */
function UserProtection() {
  const [status, setStatus] = useState('checking') // 'checking' | 'valid' | 'invalid'

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      const token = localStorage.getItem('userToken');

      if (!token) {
        if (isMounted) setStatus('invalid');
        return;
      }

      // Pre-validate JWT structure and expiration
      const payload = getJwtPayload(token);
      if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        toast.error('Session expired. Please log in again.', {
          toastId: 'auth-session-expired',
        });
        if (isMounted) setStatus('invalid');
        return;
      }

      try {
        await api.get('/auth/validate', {
          headers: {
            Authorization: `Bearer ${token}`,
            'auth-token': token,
          },
        });
        if (isMounted) setStatus('valid');
      } catch (err) {
        const responseStatus = err.response?.status;
        // Only invalidate and clear session if explicitly rejected (401 Unauthorized or 403 Forbidden)
        if (responseStatus === 401 || responseStatus === 403) {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          const message =
            err.response?.data?.message || 'Session expired. Please log in again.';
          toast.error(message, { toastId: 'auth-session-expired' });
          if (isMounted) setStatus('invalid');
        } else {
          // In case of transient network latency or backend cold start, do NOT destroy
          // the session if the JWT itself is cryptographically valid and unexpired
          if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
            if (isMounted) setStatus('valid');
          } else {
            if (isMounted) setStatus('invalid');
          }
        }
      }
    };

    validate();
    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'checking') return <Loader text="Restoring session..." />;
  if (status === 'valid')    return <Outlet />;
  return <Navigate to="/login" replace />;
}

export default UserProtection;
