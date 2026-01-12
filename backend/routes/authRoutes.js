import express from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getUserProfile,
  deleteAccount,
  resendOTP,
  authenticate
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
