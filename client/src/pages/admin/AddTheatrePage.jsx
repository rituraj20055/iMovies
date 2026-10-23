import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faPlus,
  faTrash,
  faMapMarkerAlt,
  faChair,
  faRupeeSign,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AddTheatrePage = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [theatreName, setTheatreName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [balconyPrice, setBalconyPrice] = useState(350);
  const [middlePrice, setMiddlePrice] = useState(250);
  const [lowerPrice, setLowerPrice] = useState(150);

  // Seat Rows and Cols
  const [balconyRows, setBalconyRows] = useState(2);
  const [balconyCols, setBalconyCols] = useState(10);
  const [middleRows, setMiddleRows] = useState(3);
  const [middleCols, setMiddleCols] = useState(10);
  const [lowerRows, setLowerRows] = useState(2);
  const [lowerCols, setLowerCols] = useState(10);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/theatre');
      setTheatres(res.data.theatres || res.data || []);
    } catch (err) {
      console.error('Error fetching theatres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const totalBalcony = balconyRows * balconyCols;
  const totalMiddle = middleRows * middleCols;
  const totalLower = lowerRows * lowerCols;
  const grandTotalSeats = totalBalcony + totalMiddle + totalLower;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!theatreName.trim() || !location.trim()) {
      toast.warning('Please enter theatre name and location');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        theatreName: theatreName.trim(),
        location: location.trim(),
        address: address.trim(),
        balconySeatPrice: Number(balconyPrice),
        middleSeatPrice: Number(middlePrice),
        lowerSeatPrice: Number(lowerPrice),
        balconySeats: { rows: Number(balconyRows), cols: Number(balconyCols), total: totalBalcony },
        middleSeats: { rows: Number(middleRows), cols: Number(middleCols), total: totalMiddle },
        lowerSeats: { rows: Number(lowerRows), cols: Number(lowerCols), total: totalLower },
      };

      await api.post('/api/theatre', payload);
      toast.success('Theatre added successfully!');
      setTheatreName('');
      setLocation('');
      setAddress('');
      fetchTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add theatre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (theatreId) => {
    if (!window.confirm('Are you sure you want to delete this theatre?')) return;
    try {
      await api.delete(`/api/theatre/${theatreId}`);
      toast.success('Theatre deleted');
      fetchTheatres();
    } catch (err) {
      toast.error('Could not delete theatre');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeRoute="theatres" />

      <main className="admin-main">
        <div className="container-fluid py-2">
          {/* Header */}
          <div className="admin-page-header mb-4">
            <div>
              <h1 className="admin-page-title d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} style={{ color: 'var(--primary-accent)' }} />
                <span>Theatre Management</span>
              </h1>
              <p className="admin-page-subtitle">
                Register cinema properties and configure multi-tier seating layouts & pricing.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Add Theatre Form */}
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
                  <FontAwesomeIcon icon={faPlus} className="text-danger small" />
                  <span>Register New Theatre</span>
                </h4>

                <form onSubmit={handleSubmit}>
                  {/* Basic Info */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Theatre Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. PVR Director's Cut"
                      value={theatreName}
                      onChange={(e) => setTheatreName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>City / Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. South Delhi"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold" style={{ color: 'var(--text-secondary)' }}>Address</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mall / Street"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tier Pricing */}
                  <h6 className="text-danger fw-bold text-uppercase small mt-4 mb-2">
                    Tier Pricing (₹ per Seat)
                  </h6>
                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="form-label small" style={{ color: 'var(--text-secondary)' }}>Balcony (VIP)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={balconyPrice}
                        onChange={(e) => setBalconyPrice(e.target.value)}
                        min={0}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small" style={{ color: 'var(--text-secondary)' }}>Middle (Exec)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={middlePrice}
                        onChange={(e) => setMiddlePrice(e.target.value)}
                        min={0}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small" style={{ color: 'var(--text-secondary)' }}>Lower (Eco)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={lowerPrice}
                        onChange={(e) => setLowerPrice(e.target.value)}
                        min={0}
                        required
                      />
                    </div>
                  </div>

                  {/* Seating Grid Configuration */}
                  <h6 className="text-danger fw-bold text-uppercase small mt-4 mb-2">
                    Seating Layout (Rows × Columns)
                  </h6>

                  <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <div className="row g-2 align-items-center">
                      <div className="col-4 text-warning fw-semibold small">Balcony</div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Rows"
                          value={balconyRows}
                          onChange={(e) => setBalconyRows(Math.max(1, Number(e.target.value)))}
                          min={1}
                        />
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Cols"
                          value={balconyCols}
                          onChange={(e) => setBalconyCols(Math.max(1, Number(e.target.value)))}
                          min={1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <div className="row g-2 align-items-center">
                      <div className="col-4 text-primary fw-semibold small">Middle</div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Rows"
                          value={middleRows}
                          onChange={(e) => setMiddleRows(Math.max(1, Number(e.target.value)))}
                          min={1}
                        />
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Cols"
                          value={middleCols}
                          onChange={(e) => setMiddleCols(Math.max(1, Number(e.target.value)))}
                          min={1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <div className="row g-2 align-items-center">
                      <div className="col-4 text-success fw-semibold small">Lower</div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Rows"
                          value={lowerRows}
                          onChange={(e) => setLowerRows(Math.max(1, Number(e.target.value)))}
                          min={1}
                        />
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Cols"
                          value={lowerCols}
                          onChange={(e) => setLowerCols(Math.max(1, Number(e.target.value)))}
                          min={1}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div
                    className="p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: 'rgba(54, 217, 255, 0.12)', border: '1px solid var(--primary-accent)' }}
                  >
                    <span className="small fw-semibold" style={{ color: 'var(--text-primary)' }}>Total Hall Capacity:</span>
                    <span className="fs-5 fw-extrabold" style={{ color: 'var(--primary-accent)' }}>{grandTotalSeats} Seats</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-cyan w-100 rounded-pill py-2.5 fw-bold"
                  >
                    {submitting ? 'Registering...' : 'Register Theatre'}
                  </button>
                </form>
              </div>
            </div>

            {/* Existing Theatres List */}
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
                  <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>Registered Theatres</h4>
                  <span className="badge bg-secondary rounded-pill px-3 py-1.5">
                    {theatres.length} Active
                  </span>
                </div>

                {loading ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading theatres...</p>
                ) : theatres.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {theatres.map((t) => (
                      <div
                        key={t.theatreId || t._id}
                        className="p-3 rounded-3"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>{t.theatreName || t.name}</h5>
                            <div className="small d-flex align-items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger small" />
                              <span>{t.location} • {t.address || 'Address on file'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(t.theatreId)}
                            className="btn btn-sm btn-outline-danger p-1.5 rounded-circle"
                            title="Delete Theatre"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>

                        <div className="d-flex flex-wrap gap-2 pt-2 border-top small" style={{ borderColor: 'var(--border-color)' }}>
                          <span className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            ID: {t.theatreId?.slice(0, 8)}...
                          </span>
                          <span className="badge bg-warning bg-opacity-25 text-warning">
                            Balcony: ₹{t.balconySeatPrice || t.seatingConfig?.balcony?.price || 300}
                          </span>
                          <span className="badge bg-primary bg-opacity-25 text-primary">
                            Middle: ₹{t.middleSeatPrice || t.seatingConfig?.middle?.price || 200}
                          </span>
                          <span className="badge bg-success bg-opacity-25 text-success">
                            Lower: ₹{t.lowerSeatPrice || t.seatingConfig?.lower?.price || 100}
                          </span>
                          <span className="badge bg-secondary ms-auto">
                            Capacity: {t.totalSeats || 70} Seats
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small" style={{ color: 'var(--text-secondary)' }}>No theatres registered yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddTheatrePage;
