import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faUserPlus,
  faUserShield,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';

/* ──────────────────────────────────────────
   Password strength helpers
────────────────────────────────────────── */
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0–5
};

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#ff6b35', '#f7b731', '#2ecc71', '#00b894'];

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
    padding: '40px 20px',
    fontFamily: "'Inter','Segoe UI',sans-serif",
    transition: 'background-color 0.25s ease',
  },
  bgBlur: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(ellipse at 70% 30%, rgba(54, 217, 255, 0.12) 0%, transparent 55%),' +
      'radial-gradient(ellipse at 30% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
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
    maxWidth: '460px',
    boxShadow: 'var(--shadow-card)',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoIcon: { fontSize: '2rem', color: 'var(--primary-accent)' },
  logoText: {
    fontSize: '1.6rem',
    fontWeight: 900,
    color: 'var(--text-primary)',
    display: 'block',
    letterSpacing: '0.05em',
    marginTop: '8px',
  },
  logoSub: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' },
  tabs: {
    display: 'flex',
    background: 'var(--bg-surface)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '28px',
    gap: '4px',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 700,
    transition: 'all 0.2s',
    background: active ? 'var(--aurora-gradient)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: active ? '0 2px 10px var(--primary-accent-glow)' : 'none',
  }),
  formGroup: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '7px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
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
  errMsg: { fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' },
  /* Strength bar */
  strengthWrap: { marginTop: '8px' },
  strengthBar: (color, filled) => ({
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    background: filled ? color : 'var(--border-color)',
    transition: 'background 0.3s',
  }),
  strengthBars: { display: 'flex', gap: '4px', marginBottom: '4px' },
  strengthLabel: (color) => ({
    fontSize: '0.72rem',
    color,
    fontWeight: 600,
    transition: 'color 0.3s',
  }),
  /* Rules */
  rules: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' },
  rule: (ok) => ({
    fontSize: '0.72rem',
    color: ok ? '#2ecc71' : 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'color 0.2s',
  }),
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
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px',
    marginTop: '8px',
    boxShadow: loading ? 'none' : '0 4px 15px var(--primary-accent-glow)',
  }),
  loginLink: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  loginA: { color: 'var(--primary-accent)', fontWeight: 700, textDecoration: 'none' },
};

/* ──────────────────────────────────────────
   Component
────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    const trimmedUser = form.username.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedUser) {
      errs.username = 'Username is required';
    } else if (trimmedUser.length < 3 || trimmedUser.length > 20) {
      errs.username = 'Username must be 3–20 characters';
    }

    if (!trimmedEmail) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Enter a valid email address';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Field change ── */
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  /* ── Submit (Regular User Sign-Up Only) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    const normalizedUsername = form.username.trim();
    const normalizedEmail = form.email.trim().toLowerCase();

    try {
      const { data } = await api.post('/auth/register', {
        username: normalizedUsername,
        email: normalizedEmail,
        password: form.password,
      });

      // Clear any prior admin session to avoid role-token contamination
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminName');

      // Persist authenticated user session
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('userEmail', data.user?.email || normalizedEmail);
      localStorage.setItem('userName', data.user?.username || normalizedUsername);

      toast.success(`Welcome to iMovies, ${data.user?.username || normalizedUsername}! 🎬`, {
        toastId: 'auth-register-success',
      });

      navigate('/home');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed. Please try again.';
      toast.error(msg, { toastId: 'auth-register-error' });
    } finally {
      setLoading(false);
    }
  };

  /* Password rule checks */
  const rules = [
    { label: 'At least 6 characters', ok: form.password.length >= 6 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'Contains a number', ok: /[0-9]/.test(form.password) },
    { label: 'Contains special character', ok: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const strengthColor = STRENGTH_COLORS[strength] || STRENGTH_COLORS[1];
  const strengthLabel = STRENGTH_LABELS[strength] || '';

  return (
    <div style={S.root}>
      <div style={S.bgBlur} />

      {/* Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <FontAwesomeIcon icon={faFilm} style={S.logoIcon} />
          <span style={S.logoText}>iMovies</span>
          <span style={S.logoSub}>Create your user account</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={S.formGroup}>
            <label style={S.label}>Username</label>
            <div style={S.inputWrap}>
              <FontAwesomeIcon icon={faUser} style={S.inputIcon} />
              <input
                type="text"
                value={form.username}
                onChange={handleChange('username')}
                placeholder="cooluser123"
                style={S.input(!!errors.username)}
                autoComplete="username"
                minLength={3}
                maxLength={20}
              />
            </div>
            {errors.username && <p style={S.errMsg}>{errors.username}</p>}
          </div>

          {/* Email */}
          <div style={S.formGroup}>
            <label style={S.label}>Email Address</label>
            <div style={S.inputWrap}>
              <FontAwesomeIcon icon={faEnvelope} style={S.inputIcon} />
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
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
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                style={{ ...S.input(!!errors.password), paddingRight: '44px' }}
                autoComplete="new-password"
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

            {/* Strength bar */}
            {form.password && (
              <div style={S.strengthWrap}>
                <div style={S.strengthBars}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} style={S.strengthBar(strengthColor, strength >= level)} />
                  ))}
                </div>
                <span style={S.strengthLabel(strengthColor)}>{strengthLabel}</span>

                {/* Rules list */}
                <div style={S.rules}>
                  {rules.map((r) => (
                    <span key={r.label} style={S.rule(r.ok)}>
                      <FontAwesomeIcon icon={r.ok ? faCheckCircle : faTimesCircle} />
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={S.formGroup}>
            <label style={S.label}>Confirm Password</label>
            <div style={S.inputWrap}>
              <FontAwesomeIcon icon={faLock} style={S.inputIcon} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="••••••••"
                style={{ ...S.input(!!errors.confirmPassword), paddingRight: '44px' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                style={S.eyeBtn}
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.confirmPassword && <p style={S.errMsg}>{errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button type="submit" style={S.submitBtn(loading)} disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Creating Account…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUserPlus} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p style={S.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={S.loginA}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
