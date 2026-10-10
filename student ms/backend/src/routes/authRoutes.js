const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Security: Public registration is strictly disabled
router.post('/register', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Public registration is disabled. Accounts can only be provisioned by the Authorized Super Admin.',
  });
});

router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/forgotpassword', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/resetpassword/:token', resetPassword);
router.put('/resetpassword/:token', resetPassword);
router.post('/reset-password', resetPassword);
router.put('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;

