import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTransactions from '../../components/AdminTransactions';
import './AdminDashboard.css';

/**
 * AdminTransactionsPage – admin page for viewing online Razorpay transactions,
 * payment statuses, and executing refunds with automatic seat releases.
 */
const AdminTransactionsPage = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faReceipt} style={{ color: 'var(--primary-accent)' }} />
              <span>Transactions & Gateway Refunds</span>
            </h1>
            <p className="admin-page-subtitle">
              Audit live Razorpay payment orders, customer checkout statuses, and execute real-time online refunds.
            </p>
          </div>
          <div className="admin-page-header__meta">
            <span className="admin-badge">Razorpay Test Gateway</span>
          </div>
        </header>

        <AdminTransactions />
      </main>
    </div>
  );
};

export default AdminTransactionsPage;
