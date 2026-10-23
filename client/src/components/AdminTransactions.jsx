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
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Refund Modal State
  const [selectedTx, setSelectedTx] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund / cancellation');
  const [processingRefund, setProcessingRefund] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/transactions');
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      toast.error(err.response?.data?.message || 'Could not load transaction records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
      const identifier = selectedTx.paymentId && selectedTx.paymentId !== 'N/A'
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
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
      default:
        return <span className="badge badge--default">{status}</span>;
    }
  };

  return (
    <div className="w-100">
      {/* Top Banner & KPI Stat Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__header">
            <span className="stat-card__tag">TOTAL PROCESSED</span>
            <div className="stat-card__icon">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
          </div>
          <div className="stat-card__body">
            <span className="stat-card__value">₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}</span>
            <span className="stat-card__label">Gross Gateway Volume</span>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__micro" style={{ color: 'var(--success)' }}>
              {stats?.completed || 0} completed payments
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__header">
            <span className="stat-card__tag">TOTAL REFUNDED</span>
            <div className="stat-card__icon" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <FontAwesomeIcon icon={faUndoAlt} />
            </div>
          </div>
          <div className="stat-card__body">
            <span className="stat-card__value" style={{ color: 'var(--danger)' }}>₹{stats?.totalRefundedAmount?.toLocaleString('en-IN') || 0}</span>
            <span className="stat-card__label">Reimbursed Amount</span>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__micro" style={{ color: 'var(--danger)' }}>
              {stats?.refunded || 0} refunded transactions
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__header">
            <span className="stat-card__tag">ACTIVE RESERVATIONS</span>
            <div className="stat-card__icon">
              <FontAwesomeIcon icon={faTicketAlt} />
            </div>
          </div>
          <div className="stat-card__body">
            <span className="stat-card__value" style={{ color: 'var(--success)' }}>{stats?.completed || 0}</span>
            <span className="stat-card__label">Valid Customer Tickets</span>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__micro">Live tickets in cinema auditoriums</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__header">
            <span className="stat-card__tag">PAYMENT GATEWAY</span>
            <div className="stat-card__icon">
              <FontAwesomeIcon icon={faShieldAlt} />
            </div>
          </div>
          <div className="stat-card__body">
            <span className="stat-card__value" style={{ color: 'var(--primary-accent)' }}>Razorpay</span>
            <span className="stat-card__label">Live Payment API</span>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__micro" style={{ color: 'var(--accent-gold)' }}>
              Test Mode Active (256-bit SSL)
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="admin-card p-3 p-md-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <FontAwesomeIcon icon={faSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-control rounded-pill ps-5 py-2"
                placeholder="Search by Booking ID, Email, Payment ID, Movie, Theatre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
            <span className="small fw-bold text-uppercase d-flex align-items-center gap-1 me-1" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              <FontAwesomeIcon icon={faFilter} style={{ color: 'var(--primary-accent)' }} />
              Status:
            </span>
            {['ALL', 'Completed', 'Refunded', 'Cancelled', 'Pending'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                  statusFilter === status
                    ? 'btn-aurora'
                    : 'btn-glass'
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Movie &amp; Theatre</th>
              <th>Show Details</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Payment ID</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faSpinner} spin className="fs-3 mb-2" style={{ color: 'var(--primary-accent)' }} />
                  <div>Loading transactions &amp; payment ledger...</div>
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faReceipt} className="fs-1 opacity-25 mb-3 d-block" />
                  <div className="fw-semibold fs-5">No transactions found</div>
                  <small>Try adjusting your search query or status filter.</small>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx._id}>
                  {/* Booking ID */}
                  <td>
                    <span className="mono">{tx.bookingId}</span>
                    <div className="small mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {dayjs(tx.createdAt).format('DD MMM YYYY, hh:mm A')}
                    </div>
                  </td>

                  {/* Customer */}
                  <td>
                    <span className="small fw-semibold text-truncate d-block" style={{ color: 'var(--text-primary)', maxWidth: '170px' }}>
                      {tx.userEmail}
                    </span>
                  </td>

                  {/* Movie & Theatre */}
                  <td>
                    <div className="fw-semibold small text-truncate" style={{ color: 'var(--text-primary)', maxWidth: '180px' }}>
                      {tx.movieName}
                    </div>
                    <div className="small text-truncate" style={{ color: 'var(--text-secondary)', maxWidth: '180px', fontSize: '0.78rem' }}>
                      {tx.theatreName}
                    </div>
                  </td>

                  {/* Show Date & Time */}
                  <td>
                    <div className="small" style={{ color: 'var(--text-primary)' }}>{tx.showDate}</div>
                    <div className="small fw-bold" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{tx.showTime}</div>
                  </td>

                  {/* Seats */}
                  <td>
                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '130px' }}>
                      {tx.selectedSeats.slice(0, 3).map((seat) => (
                        <span key={seat} className="mono py-0 px-1 small" style={{ fontSize: '0.75rem' }}>
                          {seat.replace(/[A-Za-z]+_/, '')}
                        </span>
                      ))}
                      {tx.selectedSeats.length > 3 && (
                        <span className="mono py-0 px-1 small" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          +{tx.selectedSeats.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td>
                    <span className="fw-bold" style={{ color: 'var(--primary-accent)' }}>₹{tx.totalAmount}</span>
                    <div className="small" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{tx.paymentMethod}</div>
                  </td>

                  {/* Payment ID */}
                  <td>
                    {tx.paymentId && tx.paymentId !== 'N/A' ? (
                      <div>
                        <span className="mono" style={{ fontSize: '0.75rem' }}>
                          {tx.paymentId}
                        </span>
                        {tx.refundId && (
                          <div className="text-danger small font-monospace mt-1" style={{ fontSize: '0.72rem' }}>
                            Ref: {tx.refundId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="small" style={{ color: 'var(--text-secondary)' }}>N/A</span>
                    )}
                  </td>

                  {/* Status */}
                  <td>{getStatusBadge(tx.paymentStatus)}</td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    {tx.paymentStatus === 'Completed' ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 fw-semibold"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => handleOpenRefundModal(tx)}
                      >
                        <FontAwesomeIcon icon={faUndoAlt} />
                        <span>Issue Refund</span>
                      </button>
                    ) : tx.paymentStatus === 'Refunded' ? (
                      <span className="text-danger small fw-semibold d-inline-flex align-items-center gap-1">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>Refunded</span>
                      </span>
                    ) : (
                      <span className="small" style={{ color: 'var(--text-secondary)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Scoped Refund Confirmation Modal (Immune to Bootstrap modal overrides) */}
      {selectedTx && (
        <div className="admin-modal-overlay" onClick={handleCloseRefundModal}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-dialog__header">
              <div className="admin-modal-dialog__icon">
                <FontAwesomeIcon icon={faUndoAlt} />
              </div>
              <div>
                <h3 className="admin-modal-dialog__title">Issue Gateway Refund</h3>
                <div className="small" style={{ color: 'var(--text-secondary)' }}>
                  Booking ID: <span className="mono">{selectedTx.bookingId}</span>
                </div>
              </div>
            </div>

            <p className="small mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              This will process an online refund of <strong style={{ color: 'var(--danger)' }}>₹{selectedTx.totalAmount}</strong> via Razorpay back to the customer&apos;s source account and immediately release the booked seats back to the public pool.
            </p>

            <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between mb-1.5 small">
                <span style={{ color: 'var(--text-secondary)' }}>Customer Email:</span>
                <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTx.userEmail}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5 small">
                <span style={{ color: 'var(--text-secondary)' }}>Movie:</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedTx.movieName}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5 small">
                <span style={{ color: 'var(--text-secondary)' }}>Seats:</span>
                <span className="mono py-0 px-1" style={{ fontSize: '0.78rem' }}>{selectedTx.selectedSeats.join(', ')}</span>
              </div>
              <hr className="my-2" style={{ borderColor: 'var(--border-subtle)' }} />
              <div className="d-flex justify-content-between align-items-center fw-bold">
                <span style={{ color: 'var(--text-primary)' }}>Refund Amount:</span>
                <span className="text-danger fs-5">₹{selectedTx.totalAmount}</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold mb-1 d-block" style={{ color: 'var(--text-secondary)' }}>
                Reason for Cancellation / Refund
              </label>
              <textarea
                className="form-control rounded-3 small p-2"
                rows="2"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>

            <div className="admin-modal-dialog__actions">
              <button
                type="button"
                className="btn btn-glass rounded-pill px-4"
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
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUndoAlt} />
                    <span>Confirm &amp; Refund ₹{selectedTx.totalAmount}</span>
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
