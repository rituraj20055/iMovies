const express = require('express');
const router = express.Router();
const { getPaymentConfig, createOrder, verifyPayment } = require('../controllers/paymentController');
const { fetchUser } = require('../middlewares/fetchUser');

// Payment gateway configuration
router.get('/config', getPaymentConfig);

// Step 2 & 3: Create Razorpay Order
router.post('/create-order', fetchUser, createOrder);

// Step 4: Verify Cryptographic Payment Signature
router.post('/verify', fetchUser, verifyPayment);

module.exports = router;
