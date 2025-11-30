const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Setting = require('../models/Setting'); // FIXED: Changed from '../models/Settings'
const { sendEmail } = require('../utils/emailSender');
const { protect } = require('../middleware/auth');
const router = express.Router();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9\s]/.test(password)) return false;
  return true;
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const payload = { id: user.id };
    const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ 
      token: newToken,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  console.log('Registration attempt:', { email });
  
  if (!validateEmail(email)) {
    return res.status(400).json({ 
      message: 'Please enter a valid email address' 
    });
  }
  
  if (!validatePassword(password)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with one uppercase letter, one number, and one special character' 
    });
  }

  try {
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists. Please login.' });
    }

    user = new User({ email, password });
    
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    
    await user.save();

    // Create default settings for user
    const settings = new Setting({
      user: user._id,
      theme: 'light',
      primaryColor: '#4e73df',
      secondaryColor: '#858796',
      notificationTime: 30
    });
    await settings.save();

    // Send OTP email
    await sendEmail(
      email, 
      'Verify Your Email - OnTime', 
      `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`
    );

    res.status(201).json({ 
      message: 'OTP sent to email. Please verify to complete registration.',
      userId: user._id
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    
    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please register.' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP email
    await sendEmail(
      email, 
      'New OTP - OnTime', 
      `Your new OTP for email verification is: ${otp}. It will expire in 10 minutes.`
    );

    res.json({ 
      message: 'New OTP sent to email',
      userId: user._id
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please register.' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP email
    await sendEmail(
      email, 
      'Password Reset OTP - OnTime', 
      `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`
    );

    res.json({ 
      message: 'OTP sent to email for password reset',
      userId: user._id
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  // Validate new password
  if (!validatePassword(newPassword)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with one uppercase letter, one number, and one special character' 
    });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    
    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update password
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. Please login with new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email not verified. Please verify your email.' });
    }

    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token endpoint
router.get('/verify', protect, async (req, res) => {
  try {
    res.json({ 
      user: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Delete account endpoint
router.delete('/account', protect, async (req, res) => {
  try {
    const Deadline = require('../models/Deadline');
    const Setting = require('../models/Setting'); // FIXED: Changed from '../models/Settings'
    
    // Remove user's deadlines
    await Deadline.deleteMany({ user: req.user.id });
    
    // Remove user's settings
    await Setting.deleteOne({ user: req.user.id });
    
    // Remove user
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;