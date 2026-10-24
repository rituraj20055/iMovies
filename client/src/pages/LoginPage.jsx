import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faSignInAlt,
  faUserShield,
  faSpinner,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';

/* ──────────────────────────────────────────
   Styles
────────────────────────────────────────── */
const S = {
  root: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Inter','Segoe UI',sans-serif",
    transition: 'background-color 0.25s ease',
  },
  bgBlur: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(ellipse at 30% 40%, rgba(54, 217, 255, 0.12) 0%, transparent 55%),' +
      'radial-gradient(ellipse at 70% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'var(--bg-card)',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: 'var(--shadow-card)',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoIcon: {
    fontSize: '2rem',
    color: 'var(--primary-accent)',
  },
  logoText: {
    fontSize: '1.6rem',
    fontWeight: 900,
    color: 'var(--text-primary)',
    display: 'block',
    letterSpacing: '0.05em',
    marginTop: '8px',
  },
  logoSub: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },
  adminBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(54, 217, 255, 0.12)',
    color: 'var(--primary-accent)',
    border: '1px solid rgba(54, 217, 255, 0.3)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '8px',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    pointerEvents: 'none',
  },
  input: (err) => ({
    width: '100%',
    background: 'var(--bg-surface)',
    border: `1.5px solid ${err ? 'var(--danger)' : 'var(--border-color)'}`,
    borderRadius: '10px',
    padding: '12px 14px 12px 40px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }),
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '4px',
  },
  errMsg: {
    fontSize: '0.75rem',
    color: 'var(--danger)',
    marginTop: '4px',
  },
  submitBtn: (loading) => ({
    width: '100%',
    background: loading ? 'rgba(54, 217, 255, 0.4)' : 'var(--aurora-gradient)',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
    marginBottom: '20px',
    boxShadow: loading ? 'none' : '0 4px 15px var(--primary-accent-glow)',
  }),
  footerLink: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  linkA: {
    color: 'var(--primary-accent)',
    fontWeight: 700,
    textDecoration: 'none',
  },
};

/* ──────────────────────────────────────────
   Component
────────────────────────────────────────── */
const LoginPage = ({ adminMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPortal = adminMode || location.pathname === '/admin-login';
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* Form state */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    const trimmed = email.trim();
    if (!trimmed) {
      errs.email = isAdminPortal ? 'Admin email or username is required' : 'Email or username is required';
    } else if (trimmed.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errs.email = 'Please enter a valid email address';
    } else if (!trimmed.includes('@') && trimmed.length < 3) {
      errs.email = 'Username must be at least 3 characters';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    const normalizedIdentifier = email.trim();

    try {
      const endpoint = isAdminPortal ? '/auth/admin/login' : '/auth/login';
      const { data } = await api.post(endpoint, {
        email: normalizedIdentifier,
        username: normalizedIdentifier,
        password
      });

      if (isAdminPortal) {
        // Clear any prior regular user session
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');

        const adminObj = data.admin || data.user || {};
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(adminObj));
        localStorage.setItem('adminEmail', adminObj.email || normalizedIdentifier);
        localStorage.setItem('adminName', adminObj.username || 'Admin');

        toast.success('Welcome to iMovies Admin Portal! 🛡️', {
          toastId: 'auth-admin-login-success'
        });
        navigate('/admin');
      } else {
        // Clear any prior admin session
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');

        const userObj = data.user || {};
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(userObj));
        localStorage.setItem('userEmail', userObj.email || normalizedIdentifier);
        localStorage.setItem('userName', userObj.username || 'User');

        toast.success(`Welcome back, ${userObj.username || 'User'}! 🎬`, {
          toastId: 'auth-login-success'
        });
        navigate('/home');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Login failed. Please check your credentials.';
      toast.error(msg, { toastId: 'auth-login-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
  };

  return (
    <div style={S.root}>
      <div style={S.bgBlur} />

      {/* Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={S.card}>
        {/* Logo & Header */}
        <div style={S.logoWrap}>
          <FontAwesomeIcon icon={isAdminPortal ? faShieldAlt : faFilm} style={S.logoIcon} />
          <span style={S.logoText}>iMovies</span>
          {isAdminPortal ? (
            <div>
              <div style={S.adminBadge}>
                <FontAwesomeIcon icon={faUserShield} />
                <span>Admin Portal</span>
              </div>
              <p style={{ ...S.logoSub, marginTop: '8px' }}>
                Restricted staff access for authorized administrators only.
              </p>
            </div>
          ) : (
            <span style={S.logoSub}>Sign in to your account</span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={S.formGroup}>
            <label style={S.label}>{isAdminPortal ? 'Admin Email Address' : 'Email Address'}</label>
            <div style={S.inputWrap}>
              <FontAwesomeIcon icon={faEnvelope} style={S.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={isAdminPortal ? 'admin@imovies.com' : 'you@example.com'}
                style={S.input(!!errors.email)}
                autoComplete="email"
              />
            </div>
            {errors.email && <p style={S.errMsg}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div style={S.formGroup}>
            <label style={S.label}>Password</label>
            <div style={S.inputWrap}>
              <FontAwesomeIcon icon={faLock} style={S.inputIcon} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                style={{ ...S.input(!!errors.password), paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={S.eyeBtn}
                onClick={() => setShowPwd((p) => !p)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.password && <p style={S.errMsg}>{errors.password}</p>}
          </div>

          {/* Submit */}
          <button type="submit" style={S.submitBtn(loading)} disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Authenticating…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={isAdminPortal ? faUserShield : faSignInAlt} />
                {isAdminPortal ? 'Admin Sign In' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        {isAdminPortal ? (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              🔒 Administrator accounts are pre-seeded or provisioned internally by Super Admins. Public registration is prohibited.
            </div>
            <Link to="/login" style={{ ...S.linkA, fontSize: '0.85rem' }}>
              ← Return to User Login
            </Link>
          </div>
        ) : (
          <div>
            <p style={S.footerLink}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={S.linkA}>
                Sign Up
              </Link>
            </p>
            <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <Link
                to="/admin-login"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <FontAwesomeIcon icon={faShieldAlt} style={{ color: 'var(--primary-accent)' }} />
                <span>Admin Portal Access →</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
