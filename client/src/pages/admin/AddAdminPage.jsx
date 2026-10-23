import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faShieldAlt,
  faEnvelope,
  faUser,
  faLock,
  faTrash,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AddAdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/admin/users');
      setAdmins(res.data.users || res.data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/auth/admin/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        isSuperAdmin,
      });

      toast.success(`Admin ${username} created successfully!`);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsSuperAdmin(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to revoke this admin access?')) return;
    try {
      await api.delete(`/api/auth/admin/users/${userId}`);
      toast.success('Admin removed');
      fetchAdmins();
    } catch (err) {
      toast.error('Failed to remove admin');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeRoute="addadmin" />

      <main className="admin-main">
        <div className="container-fluid py-2">
          {/* Header */}
          <div className="admin-page-header mb-4">
            <div>
              <h1 className="admin-page-title d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faShieldAlt} style={{ color: 'var(--primary-accent)' }} />
                <span>Administrator Management</span>
              </h1>
              <p className="admin-page-subtitle">
                Grant and manage administrative credentials for cinema operations.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Create Admin Form */}
            <div className="col-12 col-xl-5">
              <div
                className="p-4 rounded-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h4 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FontAwesomeIcon icon={faUserPlus} className="small" style={{ color: 'var(--primary-accent)' }} />
                  <span>Create Admin User</span>
                </h4>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Admin Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. cinema_manager"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="admin@imovies.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-check form-switch mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="superAdminSwitch"
                      checked={isSuperAdmin}
                      onChange={(e) => setIsSuperAdmin(e.target.checked)}
                    />
                    <label className="form-check-label small" htmlFor="superAdminSwitch" style={{ color: 'var(--text-primary)' }}>
                      Grant Super Admin Privileges
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-aurora w-100 rounded-pill py-2.5 fw-bold"
                  >
                    {submitting ? 'Creating...' : 'Register Administrator'}
                  </button>
                </form>
              </div>
            </div>

            {/* Existing Admins List */}
            <div className="col-12 col-xl-7">
              <div
                className="p-4 rounded-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>Platform Administrators</h4>
                  <span className="badge bg-secondary rounded-pill px-3 py-1.5">
                    {admins.length} Staff
                  </span>
                </div>

                {loading ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading admins...</p>
                ) : admins.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {admins.map((a) => (
                      <div
                        key={a._id}
                        className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '42px',
                              height: '42px',
                              background: 'var(--aurora-gradient)',
                              boxShadow: '0 0 10px var(--primary-accent-glow)',
                            }}
                          >
                            {(a.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>{a.username}</span>
                              {a.isSuperAdmin && (
                                <span className="badge bg-warning text-dark small">Super Admin</span>
                              )}
                            </div>
                            <span className="small" style={{ color: 'var(--text-secondary)' }}>{a.email}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAdmin(a._id)}
                          className="btn btn-sm btn-outline-danger p-1.5 rounded-circle"
                          title="Revoke Admin"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small" style={{ color: 'var(--text-secondary)' }}>No other administrators registered.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddAdminPage;
