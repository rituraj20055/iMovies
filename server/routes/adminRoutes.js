const express = require('express');
const router = express.Router();
const { getAllTransactions, processRefund } = require('../controllers/adminController');
const { fetchAdmin } = require('../middlewares/fetchUser');

// Admin Transactions & Refund Management
router.get('/transactions', fetchAdmin, getAllTransactions);
router.post('/refund/:paymentId', fetchAdmin, processRefund);
router.post('/refund', fetchAdmin, processRefund);

module.exports = router;
