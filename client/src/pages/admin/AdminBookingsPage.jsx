import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt,
  faSearch,
  faFileCsv,
  faRupeeSign,
  faCheckCircle,
  faClock,
  faBan,
  faFilter,
  faUndoAlt,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faUser,
  faTimes,
  faRedo,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.get('/api/bookings/admin/all');
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      setFetchError(err.response?.data?.message || 'Failed to load reservations ledger.');
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (b.bookingId || '').toLowerCase().includes(q) ||
        (b.userEmail || '').toLowerCase().includes(q) ||
        (b.movieName || '').toLowerCase().includes(q) ||
        (b.theatreName || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && (b.paymentStatus === 'Completed' || b.paymentStatus === 'Confirmed')) ||
        (statusFilter === 'REFUNDED' && (b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled'));

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedBookings = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderBookingStatusBadge = (status) => {
    const s = status || 'Completed';
    switch (s) {
      case 'Completed':
      case 'Confirmed':
        return (
          <span className="badge badge--confirmed d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>{s}</span>
          </span>
        );
      case 'Refunded':
        return (
          <span className="badge badge--refunded d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faUndoAlt} />
            <span>Refunded</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="badge badge--cancelled d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faBan} />
            <span>Cancelled</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="badge badge--pending d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faClock} />
            <span>Pending</span>
          </span>
        );
      default:
        return <span className="badge badge--default">{s}</span>;
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeRoute="adminbookings" />

      <main className="admin-main">
        <div className="container-fluid py-2">
          {/* Header & Export CTA */}
          <div className="admin-page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h1 className="admin-page-title d-flex align-items-center gap-2 m-0">
                <FontAwesomeIcon icon={faTicketAlt} style={{ color: 'var(--primary-accent)' }} />
                <span>Platform Reservations</span>
              </h1>
              <p className="admin-page-subtitle mt-1">
                Monitor all ticket bookings, manage cancellations, and export audit reports.
              </p>
            </div>

            <button
              onClick={exportToCSV}
              className="btn btn-outline-aurora d-flex align-items-center gap-2"
              title="Export all reservations to CSV"
            >
              <FontAwesomeIcon icon={faFileCsv} style={{ color: 'var(--primary-accent)' }} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <div
                className="stat-card p-3 rounded-4"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="stat-card__header mb-1">
                  <span className="stat-card__tag">Ticketing</span>
                  <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15 }}>
                    <FontAwesomeIcon icon={faTicketAlt} />
                  </div>
                </div>
                <div className="stat-card__value fs-3">{totalBookings}</div>
                <div className="stat-card__label small">Total Bookings</div>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div
                className="stat-card p-3 rounded-4"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="stat-card__header mb-1">
                  <span className="stat-card__tag" style={{ color: '#10B981' }}>Confirmed</span>
                  <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15, color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </div>
                </div>
                <div className="stat-card__value fs-3" style={{ color: '#10B981' }}>{completedCount}</div>
                <div className="stat-card__label small">Active Reservations</div>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div
                className="stat-card p-3 rounded-4"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="stat-card__header mb-1">
                  <span className="stat-card__tag" style={{ color: '#8B5CF6' }}>Refunded</span>
                  <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15, color: '#8B5CF6', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                    <FontAwesomeIcon icon={faUndoAlt} />
                  </div>
                </div>
                <div className="stat-card__value fs-3" style={{ color: '#8B5CF6' }}>{refundedCount}</div>
                <div className="stat-card__label small">Cancelled / Refunded</div>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div
                className="stat-card p-3 rounded-4"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="stat-card__header mb-1">
                  <span className="stat-card__tag">Net Revenue</span>
                  <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15 }}>
                    <FontAwesomeIcon icon={faRupeeSign} />
                  </div>
                </div>
                <div className="stat-card__value fs-3" style={{ color: 'var(--primary-accent)' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="stat-card__label small">Gross Ticket Sales</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div
            className="p-3 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
          >
            {/* Search Input */}
            <div className="position-relative flex-grow-1" style={{ maxWidth: '420px' }}>
              <FontAwesomeIcon
                icon={faSearch}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                type="text"
                className="form-control rounded-pill ps-5 pe-5 py-2"
                placeholder="Search by ID, email, movie, theatre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="small fw-bold text-uppercase d-flex align-items-center gap-1 me-1" style={{ color: 'var(--text-secondary)' }}>
                <FontAwesomeIcon icon={faFilter} style={{ color: 'var(--primary-accent)' }} />
                Status:
              </span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'COMPLETED', label: 'Confirmed' },
                { id: 'REFUNDED', label: 'Refunded' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setStatusFilter(id)}
                  className={`btn btn-sm rounded-pill px-3 py-1.5 ${
                    statusFilter === id ? 'btn-aurora fw-bold text-white' : 'btn-glass'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table Container */}
          <div className="admin-table-container">
            <div className="table-responsive">
              <table className="admin-table admin-bookings-table mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Movie & Theatre</th>
                    <th className="py-3 px-3">Showtime</th>
                    <th className="py-3 px-3">Seats</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                        <FontAwesomeIcon icon={faSpinner} spin className="fs-3 mb-2 d-block mx-auto" style={{ color: 'var(--primary-accent)' }} />
                        <div className="fw-semibold">Loading platform reservations...</div>
                        <small className="text-muted">Fetching latest ledger from database</small>
                      </td>
                    </tr>
                  ) : fetchError ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                        <div className="text-danger fw-semibold fs-6 mb-2">{fetchError}</div>
                        <button
                          type="button"
                          onClick={fetchAllBookings}
                          className="btn btn-sm btn-outline-aurora rounded-pill px-3"
                        >
                          <FontAwesomeIcon icon={faRedo} className="me-1" /> Retry
                        </button>
                      </td>
                    </tr>
                  ) : paginatedBookings.length > 0 ? (
                    paginatedBookings.map((b) => {
                      const isRefunded =
                        b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled';
                      const bookingKey = b.bookingId || b._id;

                      return (
                        <tr key={bookingKey}>
                          {/* Booking ID */}
                          <td className="px-3">
                            <span className="mono">{b.bookingId || b._id}</span>
                            {b.createdAt && (
                              <div className="small mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                {dayjs(b.createdAt).format('DD MMM YYYY, hh:mm A')}
                              </div>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="px-3">
                            <div className="d-flex align-items-center gap-1.5">
                              <FontAwesomeIcon icon={faUser} className="small opacity-50" style={{ color: 'var(--text-secondary)' }} />
                              <span
                                className="small fw-semibold text-truncate d-inline-block"
                                style={{ color: 'var(--text-primary)', maxWidth: '180px' }}
                                title={b.userEmail}
                              >
                                {b.userEmail}
                              </span>
                            </div>
                          </td>

                          {/* Movie & Theatre */}
                          <td className="px-3">
                            <div className="fw-bold small text-truncate" style={{ color: 'var(--text-primary)', maxWidth: '200px' }} title={b.movieName}>
                              {b.movieName || 'N/A'}
                            </div>
                            <div className="small text-truncate" style={{ color: 'var(--text-secondary)', maxWidth: '200px', fontSize: '0.78rem' }} title={b.theatreName}>
                              {b.theatreName || 'N/A'}
                            </div>
                          </td>

                          {/* Showtime */}
                          <td className="px-3">
                            <div className="small" style={{ color: 'var(--text-primary)' }}>
                              {b.showDate ? dayjs(b.showDate).format('MMM D, YYYY') : 'N/A'}
                            </div>
                            <div className="fw-bold small" style={{ color: 'var(--primary-accent)', fontSize: '0.82rem' }}>
                              {b.showTime || 'N/A'}
                            </div>
                          </td>

                          {/* Seats */}
                          <td className="px-3">
                            <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '150px' }}>
                              {(b.selectedSeats || []).map((seat) => (
                                <span key={seat} className="admin-seat-chip">
                                  {seat.replace(/[A-Za-z]+_/, '')}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-3">
                            <span className="fw-bold fs-6" style={{ color: 'var(--primary-accent)' }}>
                              ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                            {b.paymentMethod && (
                              <div className="small" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                {b.paymentMethod}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3">{renderBookingStatusBadge(b.paymentStatus)}</td>

                          {/* Actions */}
                          <td className="text-end px-3">
                            {!isRefunded ? (
                              <button
                                onClick={() => handleAdminCancel(bookingKey)}
                                disabled={cancellingId === bookingKey}
                                className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '0.78rem' }}
                              >
                                {cancellingId === bookingKey ? (
                                  <>
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    <span>Refunding...</span>
                                  </>
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faUndoAlt} />
                                    <span>Refund</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-secondary small fw-semibold d-inline-flex align-items-center gap-1">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-danger" />
                                <span>Refunded</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                        <FontAwesomeIcon icon={faTicketAlt} className="fs-1 opacity-25 mb-3 d-block mx-auto" />
                        <div className="fw-semibold fs-5">No reservations found</div>
                        <small className="text-muted">Try adjusting your search query or status filter.</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filtered.length > 0 && (
              <div className="admin-pagination">
                <div className="admin-pagination__info">
                  Showing <span className="fw-bold text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="fw-bold text-primary">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{' '}
                  <span className="fw-bold text-primary">{filtered.length}</span> reservations
                </div>

                {totalPages > 1 && (
                  <div className="admin-pagination__nav">
                    <button
                      type="button"
                      className="admin-pagination__btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-1 text-muted">...</span>
                          )}
                          <button
                            type="button"
                            className={`admin-pagination__btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}

                    <button
                      type="button"
                      className="admin-pagination__btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminBookingsPage;
