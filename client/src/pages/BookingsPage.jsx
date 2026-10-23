import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faQrcode,
  faPrint,
  faTimesCircle,
  faCheckCircle,
  faFilm,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/bookings/user');
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
      toast.error('Could not load bookings history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? A refund will be initiated.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await api.put(`/api/bookings/cancel/${bookingId}`);
      if (res.data.success) {
        toast.success('Booking cancelled and refund initiated.');
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'COMPLETED') return b.paymentStatus === 'Completed' || b.paymentStatus === 'Confirmed';
    if (activeTab === 'CANCELLED') return b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled';
    return true;
  });

  if (loading) return <Loader message="Loading your ticket history..." />;

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1 py-5">
        <div className="container">
          {/* Header Row */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="movie-row-indicator" />
                <h2 className="fw-extrabold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FontAwesomeIcon icon={faTicketAlt} style={{ color: 'var(--primary-red)' }} />
                  <span>My Bookings</span>
                </h2>
              </div>
              <p className="small mt-1" style={{ color: 'var(--text-secondary)' }}>
                View your confirmed movie tickets, digital passes, and order history.
              </p>
            </div>

            {/* Filter Tabs */}
            <div
              className="btn-group p-1 rounded-pill"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {['ALL', 'COMPLETED', 'CANCELLED'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`btn btn-sm rounded-pill px-3 py-1.5 transition-all ${
                    activeTab === tab ? 'btn-red fw-bold shadow-sm' : 'btn-glass border-0'
                  }`}
                >
                  {tab === 'ALL' ? 'All Tickets' : tab === 'COMPLETED' ? 'Active' : 'Cancelled'}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="row g-4">
              {filteredBookings.map((b) => {
                const isCancelled =
                  b.paymentStatus === 'Refunded' || b.paymentStatus === 'Cancelled';

                return (
                  <div key={b._id || b.bookingId} className="col-12 col-lg-6">
                    <div
                      className="card border-0 rounded-4 overflow-hidden h-100 shadow-sm"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        {/* Top info */}
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <span
                                className="badge-ott font-monospace mb-2 d-inline-block"
                                style={{ fontSize: '0.72rem' }}
                              >
                                {b.bookingId}
                              </span>
                              <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {b.movieName || 'Movie Screening'}
                              </h4>
                              <div className="small d-flex align-items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: 'var(--primary-red)' }} />
                                <span>{b.theatreName || 'Cinema Multiplex'}</span>
                              </div>
                            </div>

                            <span
                              className={`badge rounded-pill px-3 py-1.5 fw-bold ${
                                isCancelled ? 'bg-secondary' : 'bg-success'
                              }`}
                            >
                              {b.paymentStatus || 'Completed'}
                            </span>
                          </div>

                          <hr className="my-3" style={{ borderColor: 'var(--border-color)' }} />

                          {/* Details Grid */}
                          <div className="row g-2 small mb-3">
                            <div className="col-6">
                              <span className="d-block" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show Date</span>
                              <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                                {dayjs(b.showDate).format('ddd, MMM D, YYYY')}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="d-block" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show Time</span>
                              <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{b.showTime || '07:00 PM'}</span>
                            </div>
                            <div className="col-6 mt-2">
                              <span className="d-block" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seats</span>
                              <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                                {Array.isArray(b.selectedSeats) ? b.selectedSeats.join(', ') : 'Seats'}
                              </span>
                            </div>
                            <div className="col-6 mt-2">
                              <span className="d-block" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount</span>
                              <span className="fw-extrabold fs-6" style={{ color: 'var(--primary-red)' }}>₹{b.totalAmount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="d-flex align-items-center gap-2 pt-2 border-top mt-auto" style={{ borderColor: 'var(--border-color)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(b)}
                            className="btn-glass px-3 py-1.5"
                            style={{ fontSize: '0.82rem' }}
                          >
                            <FontAwesomeIcon icon={faQrcode} />
                            <span>Digital Ticket</span>
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelBooking(b.bookingId || b._id)}
                              disabled={cancellingId === (b.bookingId || b._id)}
                              className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 ms-auto"
                            >
                              {cancellingId === (b.bookingId || b._id) ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div
              className="text-center py-5 rounded-4 my-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <div className="mb-3" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>
                <FontAwesomeIcon icon={faFilm} />
              </div>
              <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Bookings Found</h4>
              <p className="mb-4 mx-auto" style={{ maxWidth: '420px', color: 'var(--text-secondary)' }}>
                You haven't booked any movie tickets yet. Explore movies currently showing and book your seats in real time!
              </p>
              <Link to="/home" className="btn-cyan px-4 py-2 text-decoration-none">
                Browse Movies
              </Link>
            </div>
          )}
        </div>

        {/* Printable Digital Ticket Modal */}
        {selectedTicket && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content border-0 rounded-4 overflow-hidden shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Cinema Ticket Header */}
                <div
                  className="p-4 text-center position-relative text-white"
                  style={{
                    background: 'var(--aurora-gradient)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                    onClick={() => setSelectedTicket(null)}
                    aria-label="Close Ticket Modal"
                  />
                  <span className="badge bg-black bg-opacity-50 text-white rounded-pill px-3 py-1 mb-2 small">
                    iMovies Boarding Pass
                  </span>
                  <h3 className="fw-extrabold text-white m-0">{selectedTicket.movieName}</h3>
                  <div className="text-white text-opacity-80 small mt-1">
                    {selectedTicket.theatreName}
                  </div>
                </div>

                {/* Perforated Divider */}
                <div
                  className="d-flex justify-content-between align-items-center px-2 py-1"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div
                    className="rounded-circle"
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--bg-primary)',
                      marginLeft: '-20px',
                    }}
                  />
                  <div
                    className="flex-grow-1 mx-2"
                    style={{ borderTop: '2px dashed var(--border-color)' }}
                  />
                  <div
                    className="rounded-circle"
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--bg-primary)',
                      marginRight: '-20px',
                    }}
                  />
                </div>

                {/* Ticket Body */}
                <div className="modal-body p-4 pt-2">
                  <div className="row g-3 small mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <div className="col-6">
                      <span className="d-block" style={{ color: 'var(--text-muted)' }}>Booking Reference</span>
                      <span className="fw-bold font-monospace" style={{ color: 'var(--text-primary)' }}>
                        {selectedTicket.bookingId}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="d-block" style={{ color: 'var(--text-muted)' }}>Status</span>
                      <span className="text-success fw-bold">
                        {selectedTicket.paymentStatus || 'Confirmed'}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="d-block" style={{ color: 'var(--text-muted)' }}>Date</span>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                        {dayjs(selectedTicket.showDate).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="d-block" style={{ color: 'var(--text-muted)' }}>Time</span>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTicket.showTime}</span>
                    </div>
                    <div className="col-6">
                      <span className="d-block" style={{ color: 'var(--text-muted)' }}>Seats Reserved</span>
                      <span className="fw-bold fs-6" style={{ color: 'var(--text-primary)' }}>
                        {Array.isArray(selectedTicket.selectedSeats)
                          ? selectedTicket.selectedSeats.join(', ')
                          : selectedTicket.selectedSeats}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="d-block" style={{ color: 'var(--text-muted)' }}>Total Paid</span>
                      <span className="fw-extrabold fs-6" style={{ color: 'var(--primary-red)' }}>
                        ₹{selectedTicket.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* QR Code graphic mockup */}
                  <div
                    className="p-3 rounded-3 text-center bg-white text-dark d-flex flex-column align-items-center justify-content-center mx-auto shadow-sm"
                    style={{ maxWidth: '180px' }}
                  >
                    <FontAwesomeIcon icon={faQrcode} style={{ fontSize: '4.8rem' }} />
                    <span className="font-monospace fw-bold mt-1" style={{ fontSize: '0.72rem' }}>
                      {selectedTicket.bookingId}
                    </span>
                  </div>

                  <p className="text-center small mt-3 mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Present this electronic ticket at the cinema entry scanner. Enjoy your show!
                  </p>
                </div>

                <div className="modal-footer border-0 p-3 pt-0">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-glass px-4"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    <span>Print Ticket</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="btn-red px-4"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BookingsPage;
