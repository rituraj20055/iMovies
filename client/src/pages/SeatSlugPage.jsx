import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Loader from '../components/Loader';
import api from '../utils/api';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faClock,
  faCalendarAlt,
  faLock,
  faCheckCircle,
  faCreditCard,
  faTimes,
  faTicketAlt,
  faShieldAlt,
  faArrowLeft,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const SeatSlugPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [theatre, setTheatre] = useState(null);
  const [tickets, setTickets] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const timerRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserEmail = localStorage.getItem('userEmail') || '';
  const userToken = localStorage.getItem('userToken');

  // Pricing configuration with fallbacks
  const balconyPrice = theatre?.balconySeatPrice || 350;
  const middlePrice = theatre?.middleSeatPrice || 250;
  const lowerPrice = theatre?.lowerSeatPrice || 150;

  // Fetch show details
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/shows/${showId}`);
        const showData = res.data.show || res.data;
        setShow(showData);
        setMovie(showData.movieId || {});
        setTheatre(showData.theatre || {});

        // Parse tickets map/object
        let initialTickets = {};
        if (showData.tickets) {
          if (showData.tickets instanceof Map) {
            initialTickets = Object.fromEntries(showData.tickets);
          } else {
            initialTickets = showData.tickets;
          }
        }
        setTickets(initialTickets);
      } catch (err) {
        console.error('Failed to load show:', err);
        toast.error('Could not load show details');
      } finally {
        setLoading(false);
      }
    };

    fetchShowDetails();
  }, [showId]);

  // Setup Socket.io real-time connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-show', showId);
    });

    socket.on('seat-update', (data) => {
      if (data.showId === showId) {
        if (data.type === 'SEATS_LOCKED' && data.seats) {
          setTickets((prev) => {
            const updated = { ...prev };
            data.seats.forEach((seat) => {
              updated[seat] = {
                status: 'locked',
                lockedBy: data.lockedBy,
                lockExpiry: data.lockExpiry,
              };
            });
            return updated;
          });
        } else if (data.type === 'SEATS_BOOKED' && data.seats) {
          setTickets((prev) => {
            const updated = { ...prev };
            data.seats.forEach((seat) => {
              updated[seat] = { status: 'booked', bookedBy: data.bookedBy };
            });
            return updated;
          });
        } else if (data.type === 'SEATS_RELEASED' && data.seats) {
          setTickets((prev) => {
            const updated = { ...prev };
            data.seats.forEach((seat) => {
              updated[seat] = { status: 'available' };
            });
            return updated;
          });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [showId]);

  // Countdown timer for locked seats
  useEffect(() => {
    if (isLockedByMe && lockTimeRemaining !== null && lockTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsLockedByMe(false);
            setSelectedSeats([]);
            toast.warn('Seat lock expired! Seats have been released.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLockedByMe, lockTimeRemaining]);

  // Seat click handler
  const handleSeatClick = (seatId) => {
    if (isLockedByMe) {
      toast.info('Your seats are locked. Proceed to payment or cancel lock.');
      return;
    }

    const ticket = tickets[seatId];
    if (ticket?.status === 'booked') {
      toast.error('This seat is already booked');
      return;
    }
    if (ticket?.status === 'locked' && ticket.lockedBy !== currentUserEmail) {
      toast.warn('This seat is currently held by another user');
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        toast.info('You can select a maximum of 8 seats per booking');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Lock seats action (TTL: 10 mins)
  const handleLockSeats = async () => {
    if (!userToken) {
      toast.info('Please log in to reserve seats');
      navigate('/login');
      return;
    }
    if (selectedSeats.length === 0) {
      toast.warn('Please select at least 1 seat');
      return;
    }

    try {
      setLocking(true);
      const res = await api.post('/api/shows/lock-seats', {
        showId,
        seats: selectedSeats,
      });

      if (res.data.success) {
        setIsLockedByMe(true);
        setLockedSeats([...selectedSeats]);
        setLockTimeRemaining(600); // 10 minutes (600s)
        toast.success('Seats temporarily locked for 10 minutes!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to lock seats');
    } finally {
      setLocking(false);
    }
  };

  // Release lock action
  const handleReleaseLocks = async () => {
    try {
      await api.post('/api/shows/release-locks', {
        showId,
        seats: selectedSeats,
      });
      setIsLockedByMe(false);
      setSelectedSeats([]);
      setLockTimeRemaining(null);
      toast.info('Seats released');
    } catch (err) {
      toast.error('Failed to release seats');
    }
  };

  // Dynamic Razorpay script loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Confirm booking & payment adhering to strict 5-step Razorpay transaction flow
  const handleConfirmPayment = async () => {
    try {
      setPaying(true);

      // Step 2 — Frontend API Call: Request Razorpay Order Creation
      const orderRes = await api.post('/api/payment/create-order', {
        showId,
        selectedSeats,
        amount: total,
        userEmail: currentUserEmail,
        movieName: movie?.movieName || 'Movie',
        theatreName: show?.theatreName || 'Theatre',
      });

      if (!orderRes.data.success || !orderRes.data.order) {
        throw new Error(orderRes.data.message || 'Could not create payment order');
      }

      const { order, keyId, bookingId } = orderRes.data;

      // Ensure Razorpay SDK is available
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please verify your connection.');
      }

      // Step 4 — Open Razorpay Checkout modal
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TqTzbIAfhLKF63',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'iMovies Cinema Booking',
        description: `Tickets for ${movie?.movieName || 'Movie'} (${selectedSeats.length} seats)`,
        image: movie?.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=128&q=80',
        order_id: order.id,
        prefill: {
          email: currentUserEmail || 'user@imovies.com',
          contact: '9999999999',
        },
        theme: {
          color: '#36D9FF',
        },
        handler: async function (response) {
          try {
            setPaying(true);
            toast.info('Verifying payment signature with backend...');

            // Step 4 verification API call
            const verifyRes = await api.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
              paymentMethod: 'Razorpay',
            });

            if (verifyRes.data.success) {
              // Step 5 Confirmation & Notification
              toast.success('🎉 Payment verified! Booking confirmed and digital ticket generated.');
              setShowPaymentModal(false);
              navigate('/bookings');
            } else {
              toast.error(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            toast.error(verifyErr.response?.data?.message || 'Payment cryptographic verification failed');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.info('Payment checkout modal dismissed.');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (failedResp) {
        setPaying(false);
        toast.error(`Payment failed: ${failedResp.error?.description || 'Transaction declined'}`);
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      toast.error(err.response?.data?.message || err.message || 'Payment processing failed');
      setPaying(false);
    }
  };

  // Helper to format seat label for display
  const formatSeatLabel = (s) => {
    if (!s) return '';
    return s.replace('_', ' ').replace('-', ' ').toUpperCase();
  };

  // Calculate pricing breakdown
  const calculateTotals = () => {
    let balconyCount = 0;
    let middleCount = 0;
    let lowerCount = 0;

    selectedSeats.forEach((seat) => {
      const lower = seat.toLowerCase();
      if (lower.startsWith('balcony') || lower.startsWith('b-') || lower.startsWith('b_')) balconyCount++;
      else if (lower.startsWith('middle') || lower.startsWith('m-') || lower.startsWith('m_')) middleCount++;
      else if (lower.startsWith('lower') || lower.startsWith('l-') || lower.startsWith('l_')) lowerCount++;
      else middleCount++;
    });

    const subtotal =
      balconyCount * balconyPrice +
      middleCount * middlePrice +
      lowerCount * lowerPrice;

    const convenienceFee = subtotal > 0 ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal + convenienceFee;

    return {
      balconyCount,
      middleCount,
      lowerCount,
      subtotal,
      convenienceFee,
      total,
    };
  };

  const { balconyCount, middleCount, lowerCount, subtotal, convenienceFee, total } =
    calculateTotals();

  // Helper to render seat tiers grid
  const renderSeatTier = (tierCode, tierName, price, rowLabels, colsPerRow, colorBadgeClass) => {
    const tierInitial = tierCode.charAt(0).toUpperCase();

    // Tier badge colors
    const tierBadgeStyle =
      tierCode === 'balcony'
        ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)' }
        : tierCode === 'middle'
        ? { backgroundColor: 'rgba(54, 217, 255, 0.15)', color: 'var(--primary-accent)', border: '1px solid var(--primary-accent)' }
        : { backgroundColor: 'rgba(116, 85, 217, 0.15)', color: 'var(--secondary-accent)', border: '1px solid var(--secondary-accent)' };

    return (
      <div className="mb-4">
        {/* Tier Header */}
        <div
          className="d-flex justify-content-between align-items-center mb-3 px-3 py-2 rounded-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill px-3 py-1 fw-bold"
              style={tierBadgeStyle}
            >
              {tierName}
            </span>
            <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              ₹{price} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ ticket</span>
            </span>
          </div>
          <span className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>
            {rowLabels.length * colsPerRow} Total Seats
          </span>
        </div>

        {/* Rows of Seats */}
        <div className="d-flex flex-column gap-2.5 align-items-center py-2 overflow-x-auto scrollbar-none">
          {rowLabels.map((row) => (
            <div key={row} className="d-flex align-items-center">
              {/* Left Row Indicator */}
              <span
                className="fw-bold me-2 text-center user-select-none"
                style={{ width: '24px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}
              >
                {row}
              </span>

              {/* Seats container */}
              <div className="d-flex align-items-center gap-1.5">
                {Array.from({ length: colsPerRow }, (_, i) => i + 1).map((col) => {
                  const seatId = `${tierCode}_${row}${col}`;
                  const altSeatId = `${tierInitial}-${row}${col}`;
                  const ticket = tickets[seatId] || tickets[altSeatId] || tickets[`${row}${col}`];
                  const isSelected = selectedSeats.includes(seatId) || selectedSeats.includes(altSeatId);
                  const isBooked = ticket?.status === 'booked';
                  const isLocked =
                    ticket?.status === 'locked' &&
                    ticket.lockedBy !== currentUserEmail;

                  // High-contrast, theme-aware styling
                  let seatBg = 'var(--bg-surface)';
                  let seatBorder = '1.5px solid var(--border-color)';
                  let seatColor = 'var(--text-primary)';
                  let cursor = 'pointer';
                  let seatShadow = 'none';

                  if (isBooked) {
                    seatBg = 'rgba(239, 68, 68, 0.16)';
                    seatBorder = '1.5px solid var(--danger)';
                    seatColor = 'var(--danger)';
                    cursor = 'not-allowed';
                  } else if (isLocked) {
                    seatBg = 'rgba(100, 116, 139, 0.2)';
                    seatBorder = '1.5px dashed var(--text-muted)';
                    seatColor = 'var(--text-muted)';
                    cursor = 'not-allowed';
                  } else if (isSelected) {
                    seatBg = 'var(--aurora-gradient)';
                    seatBorder = '1.5px solid #FFFFFF';
                    seatColor = '#FFFFFF';
                    seatShadow = '0 0 12px var(--primary-accent-glow)';
                  } else {
                    // Available seats by tier
                    if (tierCode === 'balcony') {
                      seatBg = 'rgba(245, 158, 11, 0.12)';
                      seatBorder = '1.5px solid rgba(245, 158, 11, 0.5)';
                    } else if (tierCode === 'middle') {
                      seatBg = 'rgba(54, 217, 255, 0.10)';
                      seatBorder = '1.5px solid rgba(54, 217, 255, 0.5)';
                    } else {
                      seatBg = 'rgba(116, 85, 217, 0.10)';
                      seatBorder = '1.5px solid rgba(116, 85, 217, 0.5)';
                    }
                  }

                  // Aisle walkway spacing after column 3 and column 7
                  const isAisleBreak = col === 3 || col === 7;

                  return (
                    <button
                      key={seatId}
                      type="button"
                      onClick={() => handleSeatClick(seatId)}
                      disabled={isBooked || isLocked}
                      className="btn p-0 d-flex align-items-center justify-content-center rounded-2 transition-all"
                      style={{
                        width: '38px',
                        height: '38px',
                        minWidth: '38px',
                        backgroundColor: seatBg,
                        border: seatBorder,
                        color: seatColor,
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? '800' : '700',
                        textDecoration: isBooked ? 'line-through' : 'none',
                        boxShadow: seatShadow,
                        cursor,
                        marginRight: isAisleBreak ? '16px' : '0',
                        opacity: isBooked ? 0.65 : isLocked ? 0.55 : 1,
                        transform: isSelected ? 'scale(1.08)' : 'none',
                      }}
                      title={`${formatSeatLabel(seatId)} - ₹${price} (${
                        isBooked ? 'Booked' : isLocked ? 'Locked' : 'Available'
                      })`}
                      aria-label={`${formatSeatLabel(seatId)} ₹${price} ${isBooked ? 'Booked' : isLocked ? 'Locked' : 'Available'}`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>

              {/* Right Row Indicator */}
              <span
                className="fw-bold ms-2 text-center user-select-none"
                style={{ width: '24px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}
              >
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <Loader message="Loading interactive seat map..." />;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className="d-flex flex-column min-vh-100 page-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header />

      <main className="flex-grow-1 pb-5">
        {/* Top Sticky Header with Movie & Show Info */}
        <div
          className="py-3 px-4 border-bottom sticky-top"
          style={{
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border-color)',
            zIndex: 1020,
          }}
        >
          <div className="container d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-glass p-2 rounded-circle"
                style={{ width: '36px', height: '36px' }}
                title="Go back"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div>
                <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>
                  {movie?.movieName || 'Movie Screening'}
                </h4>
                <div className="small d-flex flex-wrap align-items-center gap-2 mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>{theatre?.theatreName || 'Cinema Hall'}</span>
                  <span>•</span>
                  <span>{dayjs(show?.showDate).format('ddd, MMM D')}</span>
                  <span>•</span>
                  <span className="fw-bold" style={{ color: 'var(--primary-red)' }}>{show?.showTime}</span>
                </div>
              </div>
            </div>

            {/* Lock Status / Timer Banner */}
            {isLockedByMe && lockTimeRemaining !== null && (
              <div
                className="d-flex align-items-center gap-3 px-3 py-2 rounded-pill shadow-sm"
                style={{
                  backgroundColor: 'rgba(229, 9, 20, 0.15)',
                  border: '1px solid var(--primary-red)',
                }}
              >
                <div className="d-flex align-items-center gap-2 fw-bold" style={{ color: 'var(--primary-red)' }}>
                  <FontAwesomeIcon icon={faClock} className="fa-spin" />
                  <span>Lock Expires In:</span>
                  <span className="fs-5 font-monospace">{formatTimer(lockTimeRemaining)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReleaseLocks}
                  className="btn-glass rounded-pill px-2.5 py-0.5 small"
                  style={{ fontSize: '0.8rem' }}
                >
                  Release
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="container py-4" style={{ maxWidth: '960px' }}>
          {/* Seat Status Legend - Precisely matching real seat styles */}
          <div
            className="d-flex flex-wrap justify-content-center gap-4 py-3 mb-4 rounded-4 shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="d-flex align-items-center gap-2 small">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'rgba(54, 217, 255, 0.12)',
                  border: '1.5px solid var(--primary-accent)',
                  color: 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                1
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Available</span>
            </div>

            <div className="d-flex align-items-center gap-2 small">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center"
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'var(--aurora-gradient)',
                  border: '1.5px solid #FFFFFF',
                  color: '#FFFFFF',
                  boxShadow: '0 0 10px var(--primary-accent-glow)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                Selected ({selectedSeats.length})
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 small">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                  border: '1.5px dashed var(--text-muted)',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                }}
              >
                🔒
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Locked (10m TTL)</span>
            </div>

            <div className="d-flex align-items-center gap-2 small">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'rgba(239, 68, 68, 0.16)',
                  border: '1.5px solid var(--danger)',
                  color: 'var(--danger)',
                  fontSize: '0.7rem',
                  textDecoration: 'line-through',
                  fontWeight: 700,
                }}
              >
                ✕
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Booked</span>
            </div>
          </div>

          {/* Curved Cinema Screen Graphic */}
          <div className="text-center my-4">
            <div
              className="mx-auto rounded-pill mb-2"
              style={{
                width: '80%',
                maxWidth: '680px',
                height: '8px',
                background: 'linear-gradient(90deg, transparent 0%, var(--primary-accent) 50%, transparent 100%)',
                boxShadow: '0 0 25px var(--primary-accent-glow)',
              }}
            />
            <div
              className="small fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2"
              style={{ letterSpacing: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
            >
              <span>AUDITORIUM SCREEN THIS WAY</span>
            </div>
          </div>

          {/* Seat Layout Sections */}
          <div
            className="p-4 rounded-4 mb-5 shadow-lg"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* 1. Balcony Tier */}
            {renderSeatTier(
              'balcony',
              'Balcony (VIP)',
              balconyPrice,
              ['A', 'B'],
              10,
              'bg-warning text-dark'
            )}

            {/* 2. Middle Tier */}
            {renderSeatTier(
              'middle',
              'Middle (Executive)',
              middlePrice,
              ['C', 'D', 'E'],
              10,
              'bg-primary text-white'
            )}

            {/* 3. Lower Tier */}
            {renderSeatTier(
              'lower',
              'Lower (Economy)',
              lowerPrice,
              ['F', 'G'],
              10,
              'bg-success text-white'
            )}
          </div>
        </div>

        {/* Sticky Bottom Order & Checkout Summary Bar */}
        {selectedSeats.length > 0 && (
          <div
            className="fixed-bottom py-3 px-4 shadow-lg"
            style={{
              backgroundColor: 'var(--bg-glass)',
              backdropFilter: 'blur(14px)',
              borderTop: '1px solid var(--border-color)',
              zIndex: 1040,
            }}
          >
            <div className="container d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              {/* Selected Seats info */}
              <div>
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Seats:</span>
                  {selectedSeats.map((s) => (
                    <span
                      key={s}
                      className="badge-ott-cyan"
                    >
                      {formatSeatLabel(s)}
                    </span>
                  ))}
                </div>
                <div className="small" style={{ color: 'var(--text-muted)' }}>
                  {balconyCount > 0 && `${balconyCount} Balcony `}
                  {middleCount > 0 && `${middleCount} Middle `}
                  {lowerCount > 0 && `${lowerCount} Lower `}
                  • Subtotal: ₹{subtotal} + Fee: ₹{convenienceFee}
                </div>
              </div>

              {/* Action Buttons & Total */}
              <div className="d-flex align-items-center gap-3">
                <div className="text-end">
                  <div className="small" style={{ color: 'var(--text-muted)' }}>Total Amount</div>
                  <div className="fs-4 fw-extrabold" style={{ color: 'var(--primary-red)' }}>₹{total}</div>
                </div>

                {!isLockedByMe ? (
                  <button
                    type="button"
                    onClick={handleLockSeats}
                    disabled={locking}
                    className="btn btn-warning btn-lg px-4 rounded-pill fw-bold d-flex align-items-center gap-2 shadow"
                  >
                    <FontAwesomeIcon icon={faLock} />
                    <span>{locking ? 'Locking...' : 'Lock Seats (10m)'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="btn-red px-4 py-2.5 shadow-lg"
                    style={{ fontSize: '1rem', fontWeight: 700 }}
                  >
                    <FontAwesomeIcon icon={faCreditCard} />
                    <span>Pay ₹{total}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Simulation Modal */}
        {showPaymentModal && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content border-0 rounded-4 p-2 shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faShieldAlt} style={{ color: 'var(--primary-red)' }} />
                    <span>Secure Checkout</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowPaymentModal(false)}
                    aria-label="Close Payment Modal"
                  />
                </div>

                <div className="modal-body py-3">
                  {/* Order Recap */}
                  <div
                    className="p-3 rounded-3 mb-3"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>Movie:</span>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{movie?.movieName}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>Seats:</span>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{selectedSeats.map(formatSeatLabel).join(', ')}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>Showtime:</span>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{show?.showTime}</span>
                    </div>
                    <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />
                    <div className="d-flex justify-content-between fs-5 fw-bold" style={{ color: 'var(--text-primary)' }}>
                      <span>Total Payable:</span>
                      <span style={{ color: 'var(--primary-red)' }}>₹{total}</span>
                    </div>
                  </div>

                  {/* Razorpay Gateway Badge & Info */}
                  <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'rgba(51, 149, 255, 0.08)', border: '1px solid rgba(51, 149, 255, 0.25)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary px-2.5 py-1 fw-bold">Razorpay Secure</span>
                        <span className="badge bg-warning text-dark px-2 py-0.5 fw-bold small">Test Mode</span>
                      </div>
                      <FontAwesomeIcon icon={faShieldAlt} className="text-primary" />
                    </div>
                    <p className="small mb-0" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Supports all payment methods: <strong>UPI (GPay / PhonePe / Paytm), Credit / Debit Cards (Visa, Mastercard, RuPay), NetBanking (50+ banks)</strong> and <strong>Wallets</strong>.
                    </p>
                  </div>

                  <div className="d-flex align-items-center gap-2 p-2.5 rounded-3 mb-2" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <FontAwesomeIcon icon={faCreditCard} style={{ color: 'var(--primary-red)' }} className="ms-1" />
                    <span className="small fw-semibold" style={{ color: 'var(--text-primary)' }}>Instant verification with 256-bit encryption</span>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn-glass px-4"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={paying}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={paying}
                    onClick={handleConfirmPayment}
                    className="btn-red px-4 py-2"
                  >
                    <FontAwesomeIcon icon={faCreditCard} />
                    <span>{paying ? 'Connecting Gateway...' : `Proceed to Pay ₹${total}`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SeatSlugPage;
