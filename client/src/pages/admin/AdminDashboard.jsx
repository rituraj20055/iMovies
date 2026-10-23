import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faBuilding,
  faTicketAlt,
  faRupeeSign,
  faPlus,
  faCalendarAlt,
  faChartBar,
  faUsers,
  faSpinner,
  faExclamationTriangle,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import './AdminDashboard.css';

/**
 * AdminDashboard – main landing page for iMovies admins.
 * Shows platform KPIs, recent bookings table, and quick actions.
 */
const AdminDashboard = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [stats, setStats]             = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueByMovie, setRevenueByMovie] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const adminName  = localStorage.getItem('adminName')  || 'Admin';
  const adminEmail = localStorage.getItem('adminEmail') || '';

  // ── Fetch dashboard data ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin-login');
          return;
        }

        const [statsRes, bookingsRes] = await Promise.all([
          api.get('/api/auth/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get('/api/bookings/admin/all', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const rawStats = statsRes.data?.stats || statsRes.data || {};
        const normalizedStats = {
          totalMovies: rawStats.movies ?? rawStats.totalMovies ?? 0,
          totalTheatres: rawStats.theatres ?? rawStats.totalTheatres ?? 3,
          totalBookings: rawStats.bookings ?? rawStats.totalBookings ?? 0,
          totalRevenue: rawStats.revenue ?? rawStats.totalRevenue ?? 0,
          activeShows: rawStats.shows ?? rawStats.activeShows ?? 0,
          totalUsers: rawStats.users ?? rawStats.totalUsers ?? 0,
          cancelledBookings: rawStats.cancelled ?? rawStats.cancelledBookings ?? 0,
        };
        setStats(normalizedStats);

        const bookings = bookingsRes.data?.bookings || bookingsRes.data || [];
        // Most recent 10 bookings
        setRecentBookings(bookings.slice(0, 10));

        // Aggregate revenue per movie for the mini-chart
        const movieRevMap = {};
        bookings.forEach((b) => {
          const movieName = b.movie?.name || b.movieName || 'Unknown';
          movieRevMap[movieName] = (movieRevMap[movieName] || 0) + (b.totalAmount || 0);
        });
        const sorted = Object.entries(movieRevMap)
          .map(([name, rev]) => ({ name, rev }))
          .sort((a, b) => b.rev - a.rev)
          .slice(0, 6);
        setRevenueByMovie(sorted);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again.');
        toast.error('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 'badge badge--confirmed';
      case 'pending':   return 'badge badge--pending';
      case 'cancelled': return 'badge badge--cancelled';
      case 'refunded':  return 'badge badge--refunded';
      default:          return 'badge badge--default';
    }
  };

  // Revenue bar max value for relative bar widths
  const maxRev = revenueByMovie.length > 0 && revenueByMovie[0].rev > 0 ? revenueByMovie[0].rev : 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        {/* ── Page header ── */}
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">
              Welcome back, <span className="highlight">{adminName}</span>!
              &nbsp;Here's what's happening today.
            </p>
          </div>
          <div className="admin-page-header__meta">
            <span className="admin-badge">Super Admin</span>
            <span className="admin-email">{adminEmail}</span>
          </div>
        </header>

        {loading && (
          <div className="admin-loading">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Loading dashboard…</p>
          </div>
        )}

        {error && !loading && (
          <div className="admin-error">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── KPI stat cards (Unified Aurora Cinema Design System) ── */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-card__header">
                  <span className="stat-card__tag">CATALOG</span>
                  <div className="stat-card__icon">
                    <FontAwesomeIcon icon={faFilm} />
                  </div>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{stats?.totalMovies ?? 0}</span>
                  <span className="stat-card__label">Total Movies</span>
                </div>
                <div className="stat-card__footer">
                  <span className="stat-card__micro">Active catalog titles</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__header">
                  <span className="stat-card__tag">VENUES</span>
                  <div className="stat-card__icon">
                    <FontAwesomeIcon icon={faBuilding} />
                  </div>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{stats?.totalTheatres ?? 0}</span>
                  <span className="stat-card__label">Total Theatres</span>
                </div>
                <div className="stat-card__footer">
                  <span className="stat-card__micro">Cinema properties registered</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__header">
                  <span className="stat-card__tag">TICKETING</span>
                  <div className="stat-card__icon">
                    <FontAwesomeIcon icon={faTicketAlt} />
                  </div>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{stats?.totalBookings ?? 0}</span>
                  <span className="stat-card__label">Total Bookings</span>
                </div>
                <div className="stat-card__footer">
                  <span className="stat-card__micro">Confirmed ticket reservations</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__header">
                  <span className="stat-card__tag">FINANCE</span>
                  <div className="stat-card__icon">
                    <FontAwesomeIcon icon={faRupeeSign} />
                  </div>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{formatCurrency(stats?.totalRevenue)}</span>
                  <span className="stat-card__label">Total Revenue</span>
                </div>
                <div className="stat-card__footer">
                  <span className="stat-card__micro">Gross ticket transaction volume</span>
                </div>
              </div>
            </section>

            {/* ── Quick actions matching User Portal button styles ── */}
            <section className="quick-actions">
              <div className="quick-actions__header">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faPlus} className="text-accent" /> Quick Actions
                </h2>
                <span className="quick-actions__subtitle">Common administration tasks</span>
              </div>
              <div className="quick-actions__grid">
                <button className="btn-aurora" onClick={() => navigate('/addmovie')}>
                  <FontAwesomeIcon icon={faFilm} /> Add Movie
                </button>
                <button className="btn-cyan" onClick={() => navigate('/addtheatre')}>
                  <FontAwesomeIcon icon={faBuilding} /> Add Theatre
                </button>
                <button className="btn-violet" onClick={() => navigate('/addshow')}>
                  <FontAwesomeIcon icon={faCalendarAlt} /> Add Show
                </button>
                <button className="btn-glass" onClick={() => navigate('/adminbookings')}>
                  <FontAwesomeIcon icon={faUsers} /> Manage Bookings
                </button>
                <button className="btn-glass" onClick={() => navigate('/admin/transactions')}>
                  <FontAwesomeIcon icon={faReceipt} /> Transactions & Refunds
                </button>
              </div>
            </section>

            <div className="admin-two-col">
              {/* ── Recent bookings ── */}
              <section className="admin-card">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faTicketAlt} /> Recent Bookings
                </h2>
                {recentBookings.length === 0 ? (
                  <p className="empty-state">No bookings found.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>User Email</th>
                          <th>Movie</th>
                          <th>Theatre</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((b) => (
                          <tr key={b._id}>
                            <td className="mono">{String(b.bookingId || b._id).slice(-8).toUpperCase()}</td>
                            <td>{b.user?.email || b.userEmail || '—'}</td>
                            <td>{b.movie?.name || b.movieName || '—'}</td>
                            <td>{b.theatre?.name || b.theatreName || '—'}</td>
                            <td>{formatCurrency(b.totalAmount)}</td>
                            <td><span className={statusBadgeClass(b.paymentStatus || b.status)}>{b.paymentStatus || b.status || 'Confirmed'}</span></td>
                            <td>{formatDate(b.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button className="view-all-btn" onClick={() => navigate('/adminbookings')}>
                  View All Bookings →
                </button>
              </section>

              {/* ── Revenue by movie bar chart ── */}
              <section className="admin-card">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faChartBar} /> Revenue by Movie
                </h2>
                {revenueByMovie.length === 0 ? (
                  <p className="empty-state">No revenue data yet.</p>
                ) : (
                  <div className="rev-chart">
                    {revenueByMovie.map((item) => (
                      <div key={item.name} className="rev-chart__row">
                        <span className="rev-chart__label" title={item.name}>
                          {item.name.length > 18 ? item.name.slice(0, 18) + '…' : item.name}
                        </span>
                        <div className="rev-chart__bar-bg">
                          <div
                            className="rev-chart__bar"
                            style={{ width: `${Math.round((item.rev / maxRev) * 100)}%` }}
                          />
                        </div>
                        <span className="rev-chart__amount">{formatCurrency(item.rev)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ── Additional stats ── */}
            {stats && (
              <section className="admin-card admin-card--wide">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Platform Overview
                </h2>
                <div className="overview-grid">
                  <div className="overview-item">
                    <span className="overview-item__label">Active Shows</span>
                    <span className="overview-item__value">{stats.activeShows ?? 0}</span>
                  </div>
                  <div className="overview-item">
                    <span className="overview-item__label">Total Users</span>
                    <span className="overview-item__value">{stats.totalUsers ?? 0}</span>
                  </div>
                  <div className="overview-item">
                    <span className="overview-item__label">Cancelled Bookings</span>
                    <span className="overview-item__value">{stats.cancelledBookings ?? 0}</span>
                  </div>
                  <div className="overview-item">
                    <span className="overview-item__label">Avg. Ticket Price</span>
                    <span className="overview-item__value">
                      {formatCurrency(stats.totalBookings ? stats.totalRevenue / stats.totalBookings : 0)}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
