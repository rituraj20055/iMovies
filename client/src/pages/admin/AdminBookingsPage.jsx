import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt,
  faSearch,
  faFileCsv,
  faRupeeSign,
  faCheckCircle,
  faBan,
  faSpinner,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/bookings/admin/all');
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const handleAdminCancel = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel and refund booking ${bookingId}?`)) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await api.put(`/api/bookings/cancel/${bookingId}`);
      if (res.data.success) {
        toast.success(`Booking ${bookingId} cancelled and refunded`);
        fetchAllBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const exportToCSV = () => {
    if (bookings.length === 0) {
      toast.info('No bookings to export');
      return;
    }

    const headers = ['Booking ID,User Email,Movie,Theatre,Show Date,Show Time,Seats,Amount,Status'];
    const rows = bookings.map((b) => [
      b.bookingId || b._id,
      b.userEmail || '',
      `"${b.movieName || ''}"`,
      `"${b.theatreName || ''}"`,
      b.showDate || '',
      b.showTime || '',
      `"${(b.selectedSeats || []).join(', ')}"`,
      b.totalAmount || 0,
      b.paymentStatus || 'Completed',
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `imovies_bookings_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const totalBookings = bookings.length;
  const completedCount = bookings.filter(
    (b) => b.paymentStatus === 'Completed' || b.paymentStatus === 'Confirmed'
  ).length;
  const refundedCount = bookings.filter(
    (b) => b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled'
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'Completed' || b.paymentStatus === 'Confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Filtered
  const filtered = bookings.filter((b) => {
    const matchesSearch =
      (b.bookingId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.movieName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && (b.paymentStatus === 'Completed' || b.paymentStatus === 'Confirmed')) ||
      (statusFilter === 'REFUNDED' && (b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar activeRoute="adminbookings" />

      <main className="admin-main">
        {/* Header & Export CTA */}
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faTicketAlt} style={{ color: 'var(--primary-accent)' }} />
              <span>Platform Reservations</span>
            </h1>
            <p className="admin-page-subtitle">
              Monitor all ticket bookings, manage cancellations, and export audit reports.
            </p>
          </div>

          <button
            onClick={exportToCSV}
            className="btn btn-outline-aurora d-flex align-items-center gap-2 rounded-pill px-4"
          >
            <FontAwesomeIcon icon={faFileCsv} style={{ color: 'var(--success)' }} />
            <span>Export CSV</span>
          </button>
        </header>

        {/* Unified Aurora KPI Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__tag">TOTAL BOOKINGS</span>
              <div className="stat-card__icon">
                <FontAwesomeIcon icon={faTicketAlt} />
              </div>
            </div>
            <div className="stat-card__body">
              <span className="stat-card__value">{totalBookings}</span>
              <span className="stat-card__label">Total Reservations</span>
            </div>
            <div className="stat-card__footer">
              <span className="stat-card__micro">All registered customer checkouts</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__tag">ACTIVE TICKETS</span>
              <div className="stat-card__icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
            </div>
            <div className="stat-card__body">
              <span className="stat-card__value" style={{ color: 'var(--success)' }}>{completedCount}</span>
              <span className="stat-card__label">Confirmed Bookings</span>
            </div>
            <div className="stat-card__footer">
              <span className="stat-card__micro">Active seats in cinema theatres</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__tag">CANCELLATIONS</span>
              <div className="stat-card__icon">
                <FontAwesomeIcon icon={faBan} />
              </div>
            </div>
            <div className="stat-card__body">
              <span className="stat-card__value" style={{ color: 'var(--text-secondary)' }}>{refundedCount}</span>
              <span className="stat-card__label">Cancelled / Refunded</span>
            </div>
            <div className="stat-card__footer">
              <span className="stat-card__micro">Seats released back to pool</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__tag">GROSS REVENUE</span>
              <div className="stat-card__icon">
                <FontAwesomeIcon icon={faRupeeSign} />
              </div>
            </div>
            <div className="stat-card__body">
              <span className="stat-card__value" style={{ color: 'var(--primary-accent)' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
              <span className="stat-card__label">Confirmed Turnover</span>
            </div>
            <div className="stat-card__footer">
              <span className="stat-card__micro">Completed ticket purchase volume</span>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div
          className="admin-card p-3 p-md-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
        >
          {/* Search Input */}
          <div className="position-relative flex-grow-1" style={{ maxWidth: '420px', width: '100%' }}>
            <FontAwesomeIcon
              icon={faSearch}
              className="position-absolute top-50 start-0 translate-middle-y ms-3"
              style={{ color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-control rounded-pill ps-5 py-2"
              placeholder="Search by ID, email, or movie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="small text-uppercase fw-bold me-1" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              Status:
            </span>
            {['ALL', 'COMPLETED', 'REFUNDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm rounded-pill px-3 py-1.5 ${
                  statusFilter === st ? 'btn-aurora' : 'btn-glass'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'COMPLETED' ? 'Confirmed' : 'Refunded'}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table Wrapper */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Movie &amp; Theatre</th>
                <th>Showtime</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faSpinner} spin className="fs-3 mb-2" style={{ color: 'var(--primary-accent)' }} />
                    <div>Loading reservations...</div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((b) => {
                  const isRefunded =
                    b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled';

                  return (
                    <tr key={b.bookingId || b._id}>
                      <td className="mono">
                        {b.bookingId || String(b._id).slice(-8).toUpperCase()}
                      </td>
                      <td className="small" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-truncate d-block" style={{ maxWidth: '180px' }}>
                          {b.userEmail}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold small" style={{ color: 'var(--text-primary)' }}>
                          {b.movieName}
                        </div>
                        <div className="small" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {b.theatreName}
                        </div>
                      </td>
                      <td className="small" style={{ color: 'var(--text-secondary)' }}>
                        <div>{dayjs(b.showDate).format('MMM D, YYYY')}</div>
                        <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{b.showTime}</div>
                      </td>
                      <td className="small font-monospace" style={{ color: 'var(--text-primary)' }}>
                        {(b.selectedSeats || []).join(', ')}
                      </td>
                      <td className="fw-bold" style={{ color: 'var(--primary-accent)' }}>
                        ₹{b.totalAmount}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isRefunded ? 'badge--refunded' : 'badge--confirmed'
                          }`}
                        >
                          {b.paymentStatus || 'Completed'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isRefunded && (
                          <button
                            onClick={() => handleAdminCancel(b.bookingId || b._id)}
                            disabled={cancellingId === (b.bookingId || b._id)}
                            className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1"
                            style={{ fontSize: '0.78rem' }}
                          >
                            {cancellingId === (b.bookingId || b._id) ? 'Refunding...' : 'Refund'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faReceipt} className="fs-1 opacity-25 mb-3 d-block" />
                    <div className="fw-semibold fs-5">No reservations found</div>
                    <small>Try adjusting your search query or status filter.</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminBookingsPage;

