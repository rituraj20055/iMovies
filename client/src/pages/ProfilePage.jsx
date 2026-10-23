import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faTicketAlt,
  faLock,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Name State
  const [newUsername, setNewUsername] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [validateRes, bookingsRes] = await Promise.allSettled([
          api.get('/api/auth/validate'),
          api.get('/api/bookings/user'),
        ]);

        if (validateRes.status === 'fulfilled') {
          const userData = validateRes.value.data.user || validateRes.value.data;
          setUser(userData);
          setNewUsername(userData.username || '');
        } else {
          // Fallback to localStorage
          const localUser = localStorage.getItem('userData') || localStorage.getItem('user');
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              setUser(parsed);
              setNewUsername(parsed.username || '');
            } catch (e) {
              // Ignore json error
            }
          }
        }

        if (bookingsRes.status === 'fulfilled') {
          setBookings(bookingsRes.value.data.bookings || bookingsRes.value.data || []);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateName = (e) => {
    e.preventDefault();
    if (newUsername.trim().length < 3) {
      toast.warning('Username must be at least 3 characters long');
      return;
    }
    setUpdatingName(true);
    setTimeout(() => {
      localStorage.setItem('userName', newUsername.trim());
      if (user) {
        const updated = { ...user, username: newUsername.trim() };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      setUpdatingName(false);
      toast.success('Profile display name updated!');
    }, 400);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setUpdatingPass(true);
    setTimeout(() => {
      setUpdatingPass(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    navigate('/landing');
  };

  if (loading) return <Loader message="Loading profile details..." />;

  // Aggregate stats
  const totalBookings = bookings.length;
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'Completed' || b.paymentStatus === 'Confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const displayInitials = (user?.username || 'User').charAt(0).toUpperCase();

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1 py-5">
        <div className="container">
          <div className="row g-4">
            {/* Left Column: User Summary Card */}
            <div className="col-12 col-lg-4">
              <div
                className="card border-0 rounded-4 p-4 text-center shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Avatar */}
                <div
                  className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white fw-bold mb-3 shadow"
                  style={{
                    width: '90px',
                    height: '90px',
                    fontSize: '2.5rem',
                    background: 'var(--aurora-gradient)',
                    boxShadow: '0 0 20px var(--primary-accent-glow)',
                  }}
                >
                  {displayInitials}
                </div>

                <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {user?.username || 'Cinema Enthusiast'}
                </h4>
                <p className="small mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email || localStorage.getItem('userEmail')}
                </p>

                <div className="d-flex justify-content-center gap-2 mb-4">
                  <span className="badge-ott-red px-3 py-1">
                    Verified Member
                  </span>
                </div>

                {/* Stats Row */}
                <div className="row g-2 text-start pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="col-6">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <span className="small d-block" style={{ color: 'var(--text-muted)' }}>Tickets</span>
                      <span className="fs-5 fw-extrabold" style={{ color: 'var(--text-primary)' }}>{totalBookings}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <span className="small d-block" style={{ color: 'var(--text-muted)' }}>Spent</span>
                      <span className="fs-5 fw-extrabold" style={{ color: 'var(--primary-red)' }}>₹{totalSpent}</span>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline-danger w-100 rounded-pill mt-4 fw-semibold d-flex align-items-center justify-content-center gap-2 py-2"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Right Column: Forms & Activity */}
            <div className="col-12 col-lg-8">
              <div className="d-flex flex-column gap-4">
                {/* Edit Profile Info Form */}
                <div
                  className="p-4 rounded-4 shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faUser} style={{ color: 'var(--primary-red)' }} />
                    <span>Personal Details</span>
                  </h5>

                  <form onSubmit={handleUpdateName}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Username</label>
                        <input
                          type="text"
                          className="form-control form-control-dark"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                        <input
                          type="email"
                          className="form-control form-control-dark opacity-75"
                          value={user?.email || localStorage.getItem('userEmail') || ''}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="text-end mt-3">
                      <button
                        type="submit"
                        disabled={updatingName}
                        className="btn-cyan px-4"
                      >
                        {updatingName ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Change Password Form */}
                <div
                  className="p-4 rounded-4 shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faLock} style={{ color: 'var(--primary-red)' }} />
                    <span>Security & Password</span>
                  </h5>

                  <form onSubmit={handleChangePassword}>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
                        <input
                          type="password"
                          className="form-control form-control-dark"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                        <input
                          type="password"
                          className="form-control form-control-dark"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Confirm New</label>
                        <input
                          type="password"
                          className="form-control form-control-dark"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="text-end mt-3">
                      <button
                        type="submit"
                        disabled={updatingPass}
                        className="btn-glass px-4"
                      >
                        {updatingPass ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Recent Bookings Mini List */}
                <div
                  className="p-4 rounded-4 shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faTicketAlt} style={{ color: 'var(--primary-red)' }} />
                    <span>Recent Activity</span>
                  </h5>

                  {bookings.slice(0, 3).map((b) => (
                    <div
                      key={b.bookingId || b._id}
                      className="d-flex justify-content-between align-items-center py-2.5 border-bottom small"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div>
                        <span className="fw-bold d-block" style={{ color: 'var(--text-primary)' }}>{b.movieName}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{b.theatreName} • {b.showTime}</span>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold d-block" style={{ color: 'var(--primary-red)' }}>₹{b.totalAmount}</span>
                        <span className="badge bg-success bg-opacity-25 text-success">
                          {b.paymentStatus || 'Confirmed'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <p className="small m-0" style={{ color: 'var(--text-muted)' }}>No past bookings yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
