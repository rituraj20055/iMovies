import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faUndoAlt,
  faSearch,
  faFilter,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faTicketAlt,
  faShieldAlt,
  faSpinner,
  faReceipt,
  faChevronLeft,
  faChevronRight,
  faTimes,
  faRedo,
  faUser,
  faRupeeSign,
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import '../pages/admin/AdminDashboard.css';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Refund Modal State
  const [selectedTx, setSelectedTx] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund / cancellation');
  const [processingRefund, setProcessingRefund] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.get('/api/admin/transactions');
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setFetchError(err.response?.data?.message || 'Could not load transaction records.');
      toast.error(err.response?.data?.message || 'Could not load transaction records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleOpenRefundModal = (tx) => {
    setSelectedTx(tx);
    setRefundReason('Customer requested refund / cancellation');
  };

  const handleCloseRefundModal = () => {
    if (processingRefund) return;
    setSelectedTx(null);
  };

  const handleExecuteRefund = async () => {
    if (!selectedTx) return;

    try {
      setProcessingRefund(true);
      const identifier =
        selectedTx.paymentId && selectedTx.paymentId !== 'N/A'
          ? selectedTx.paymentId
          : selectedTx.bookingId;

      const res = await api.post(`/api/admin/refund/${identifier}`, {
        reason: refundReason,
      });

      if (res.data.success) {
        toast.success(
          `🎉 Refund of ₹${res.data.amountRefunded || selectedTx.totalAmount} processed! Seats released.`
        );
        handleCloseRefundModal();
        fetchTransactions();
      } else {
        toast.error(res.data.message || 'Refund processing failed');
      }
    } catch (err) {
      console.error('Refund execution error:', err);
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesSearch =
        !q ||
        t.bookingId?.toLowerCase().includes(q) ||
        t.userEmail?.toLowerCase().includes(q) ||
        t.paymentId?.toLowerCase().includes(q) ||
        t.movieName?.toLowerCase().includes(q) ||
        t.theatreName?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || t.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Confirmed':
        return (
          <span className="badge badge--confirmed d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faCheckCircle} /> Completed
          </span>
        );
      case 'Refunded':
        return (
          <span className="badge badge--refunded d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faUndoAlt} /> Refunded
          </span>
        );
      case 'Cancelled':
        return (
          <span className="badge badge--cancelled d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faTimesCircle} /> Cancelled
          </span>
        );
      case 'Pending':
        return (
          <span className="badge badge--pending d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faClock} /> Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="badge badge--cancelled d-inline-flex align-items-center gap-1">
            <FontAwesomeIcon icon={faTimesCircle} /> Failed
          </span>
        );
      default:
        return <span className="badge badge--default">{status}</span>;
    }
  };

  return (
    <div className="container-fluid py-2">
      {/* Top Banner & KPI Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div
            className="stat-card p-3 rounded-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="stat-card__header mb-1">
              <span className="stat-card__tag">Settlement</span>
              <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15 }}>
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
            </div>
            <div className="stat-card__value fs-3" style={{ color: 'var(--text-primary)' }}>
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-card__micro text-success mt-1 d-flex align-items-center gap-1">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>{stats?.completed || 0} completed payments</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
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
            <div className="stat-card__value fs-3" style={{ color: '#8B5CF6' }}>
              ₹{(stats?.totalRefundedAmount || 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-card__micro text-danger mt-1 d-flex align-items-center gap-1">
              <FontAwesomeIcon icon={faUndoAlt} />
              <span>{stats?.refunded || 0} refunded bookings</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div
            className="stat-card p-3 rounded-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="stat-card__header mb-1">
              <span className="stat-card__tag" style={{ color: '#10B981' }}>Reservations</span>
              <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15, color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <FontAwesomeIcon icon={faTicketAlt} />
              </div>
            </div>
            <div className="stat-card__value fs-3" style={{ color: '#10B981' }}>{stats?.completed || 0}</div>
            <div className="stat-card__micro mt-1" style={{ color: 'var(--text-secondary)' }}>Live valid digital tickets</div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div
            className="stat-card p-3 rounded-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="stat-card__header mb-1">
              <span className="stat-card__tag">Payment Gateway</span>
              <div className="stat-card__icon" style={{ width: 36, height: 36, fontSize: 15 }}>
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
            </div>
            <div className="stat-card__value fs-4 mt-1 d-flex align-items-center gap-2" style={{ color: 'var(--primary-accent)' }}>
              <span>Razorpay</span>
            </div>
            <div className="stat-card__micro text-warning mt-1">Sandbox Live (256-bit TLS)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="p-3 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="position-relative flex-grow-1" style={{ maxWidth: '440px' }}>
          <FontAwesomeIcon
            icon={faSearch}
            className="position-absolute top-50 start-0 translate-middle-y ms-3"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            type="text"
            className="form-control rounded-pill ps-5 pe-5 py-2"
            placeholder="Search by ID, email, payment ID, movie, theatre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
          <span className="small fw-bold text-uppercase d-flex align-items-center gap-1 me-1" style={{ color: 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={faFilter} style={{ color: 'var(--primary-accent)' }} />
            Status:
          </span>
          {['ALL', 'Completed', 'Refunded', 'Cancelled', 'Pending'].map((status) => (
            <button
              key={status}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                statusFilter === status
                  ? 'btn-aurora text-white'
                  : 'btn-glass'
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table Container */}
      <div className="admin-table-container">
        <div className="table-responsive">
          <table className="admin-table admin-transactions-table mb-0 align-middle">
            <thead>
              <tr>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Movie & Theatre</th>
                <th className="py-3 px-3">Show Details</th>
                <th className="py-3 px-3">Seats</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment ID</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faSpinner} spin className="fs-3 mb-2 d-block mx-auto" style={{ color: 'var(--primary-accent)' }} />
                    <div className="fw-semibold">Loading transactions & payment ledger...</div>
                    <small className="text-muted">Connecting to payment gateway records</small>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="9" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <div className="text-danger fw-semibold fs-6 mb-2">{fetchError}</div>
                    <button
                      type="button"
                      onClick={fetchTransactions}
                      className="btn btn-sm btn-outline-aurora rounded-pill px-3"
                    >
                      <FontAwesomeIcon icon={faRedo} className="me-1" /> Retry
                    </button>
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faReceipt} className="fs-1 opacity-25 mb-3 d-block mx-auto" />
                    <div className="fw-semibold fs-5">No transactions found</div>
                    <small className="text-muted">Try adjusting your search query or status filter.</small>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx._id || tx.bookingId}>
                    {/* Booking ID */}
                    <td className="px-3">
                      <span className="mono">{tx.bookingId}</span>
                      <div className="small mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {dayjs(tx.createdAt).format('DD MMM YYYY, hh:mm A')}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-3">
                      <div className="d-flex align-items-center gap-1.5">
                        <FontAwesomeIcon icon={faUser} className="small opacity-50" style={{ color: 'var(--text-secondary)' }} />
                        <span
                          className="small fw-semibold text-truncate d-inline-block"
                          style={{ color: 'var(--text-primary)', maxWidth: '170px' }}
                          title={tx.userEmail}
                        >
                          {tx.userEmail}
                        </span>
                      </div>
                    </td>

                    {/* Movie & Theatre */}
                    <td className="px-3">
                      <div className="fw-bold small text-truncate" style={{ color: 'var(--text-primary)', maxWidth: '180px' }} title={tx.movieName}>
                        {tx.movieName || 'N/A'}
                      </div>
                      <div className="small text-truncate" style={{ color: 'var(--text-secondary)', maxWidth: '180px', fontSize: '0.78rem' }} title={tx.theatreName}>
                        {tx.theatreName || 'N/A'}
                      </div>
                    </td>

                    {/* Show Date & Time */}
                    <td className="px-3">
                      <div className="small" style={{ color: 'var(--text-primary)' }}>
                        {tx.showDate ? dayjs(tx.showDate).format('MMM D, YYYY') : 'N/A'}
                      </div>
                      <div className="fw-bold small" style={{ color: 'var(--primary-accent)', fontSize: '0.82rem' }}>
                        {tx.showTime || 'N/A'}
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="px-3">
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '140px' }}>
                        {(tx.selectedSeats || []).slice(0, 3).map((seat) => (
                          <span key={seat} className="admin-seat-chip">
                            {seat.replace(/[A-Za-z]+_/, '')}
                          </span>
                        ))}
                        {(tx.selectedSeats || []).length > 3 && (
                          <span className="admin-seat-chip text-muted" title={(tx.selectedSeats || []).join(', ')}>
                            +{(tx.selectedSeats || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3">
                      <span className="fw-bold fs-6" style={{ color: 'var(--primary-accent)' }}>
                        ₹{(tx.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <div className="small" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                        {tx.paymentMethod || 'Razorpay'}
                      </div>
                    </td>

                    {/* Payment ID */}
                    <td className="px-3">
                      {tx.paymentId && tx.paymentId !== 'N/A' ? (
                        <div>
                          <span className="mono" style={{ fontSize: '11px', padding: '2px 6px' }}>
                            {tx.paymentId}
                          </span>
                          {tx.refundId && (
                            <div className="text-danger small font-monospace mt-1" style={{ fontSize: '0.72rem' }}>
                              Ref: {tx.refundId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="small text-muted">N/A</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3">{getStatusBadge(tx.paymentStatus)}</td>

                    {/* Actions */}
                    <td className="text-end px-3">
                      {tx.paymentStatus === 'Completed' ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 fw-semibold"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleOpenRefundModal(tx)}
                        >
                          <FontAwesomeIcon icon={faUndoAlt} />
                          <span>Issue Refund</span>
                        </button>
                      ) : tx.paymentStatus === 'Refunded' ? (
                        <span className="text-secondary small fw-semibold d-inline-flex align-items-center gap-1">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-danger" />
                          <span>Refund Done</span>
                        </span>
                      ) : (
                        <span className="small text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination__info">
              Showing <span className="fw-bold text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="fw-bold text-primary">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of{' '}
              <span className="fw-bold text-primary">{filteredTransactions.length}</span> transactions
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

      {/* Scoped Refund Confirmation Modal */}
      {selectedTx && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processingRefund) handleCloseRefundModal();
          }}
        >
          <div className="admin-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(239, 68, 68, 0.18)', color: '#EF4444' }}
                >
                  <FontAwesomeIcon icon={faUndoAlt} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                    Issue Razorpay Refund
                  </h5>
                  <div className="small text-muted">Release locked seats & trigger gateway reversal</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleCloseRefundModal}
                disabled={processingRefund}
                aria-label="Close"
              />
            </div>

            <div className="py-2">
              <p className="small mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This will process an online refund of <strong className="text-danger">₹{selectedTx.totalAmount}</strong> via Razorpay back to the customer&apos;s source account and immediately release the booked seats back to the public pool.
              </p>

              <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="d-flex justify-content-between mb-1.5 small">
                  <span style={{ color: 'var(--text-secondary)' }}>Booking ID:</span>
                  <span className="mono">{selectedTx.bookingId}</span>
                </div>
                <div className="d-flex justify-content-between mb-1.5 small">
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTx.userEmail}</span>
                </div>
                <div className="d-flex justify-content-between mb-1.5 small">
                  <span style={{ color: 'var(--text-secondary)' }}>Movie:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedTx.movieName}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 small">
                  <span style={{ color: 'var(--text-secondary)' }}>Seats:</span>
                  <span className="fw-semibold" style={{ color: 'var(--primary-accent)' }}>{(selectedTx.selectedSeats || []).join(', ')}</span>
                </div>
                <div className="d-flex justify-content-between pt-2 fw-bold" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Refund Amount:</span>
                  <span className="text-danger fs-5">₹{selectedTx.totalAmount}</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Reason for Refund
                </label>
                <textarea
                  className="form-control rounded-3 small"
                  rows="2"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for customer record..."
                />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-4"
                onClick={handleCloseRefundModal}
                disabled={processingRefund}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger rounded-pill px-4 fw-bold d-inline-flex align-items-center gap-2"
                disabled={processingRefund}
                onClick={handleExecuteRefund}
              >
                {processingRefund ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Processing Gateway Refund...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUndoAlt} />
                    <span>Confirm & Refund ₹{selectedTx.totalAmount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
