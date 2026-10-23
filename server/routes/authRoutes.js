const express = require('express');
const router = express.Router();
const {
  userRegister, userLogin, validateUser,
  adminRegister, adminLogin, validateAdmin,
  getAllUsers, deleteUser, getStats
} = require('../controllers/authController');
const { fetchUser, fetchAdmin } = require('../middlewares/fetchUser');

// User routes
router.post('/register', userRegister);
router.post('/login', userLogin);
router.get('/validate', fetchUser, validateUser);

// Admin routes (registration restricted to authenticated Super Admins)
router.post('/admin/register', fetchAdmin, adminRegister);
router.post('/admin/login', adminLogin);
router.get('/admin/validate', fetchAdmin, validateAdmin);
router.get('/admin/users', fetchAdmin, getAllUsers);
router.delete('/admin/users/:id', fetchAdmin, deleteUser);
router.get('/admin/stats', fetchAdmin, getStats);

module.exports = router;
