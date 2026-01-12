import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, verifyToken } from '../utils/tokenService.js';
import { generateOTP } from '../utils/otpService.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/emailService.js';

// Register User
export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      otp: {
        code: otp,
        expiresAt: otpExpiresAt
      },
      isEmailVerified: false
    });

    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'User registered successfully. OTP sent to your email.',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP for Email
export const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.otp = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found with this email' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, error: 'Email already verified. Please login.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = {
      code: otp,
      expiresAt: otpExpiresAt
    };
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      console.error('Failed to send OTP email to:', email);
      return res.status(500).json({ success: false, error: 'Failed to send OTP email. Please try again.' });
    }

    console.log('OTP sent successfully to:', email);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deleted' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = {
      code: otp,
      expiresAt: otpExpiresAt
    };
    await user.save();

    // Send OTP email
    await sendPasswordResetEmail(email, otp);

    res.json({
      message: 'OTP sent to your email',
      userId: user._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword, confirmPassword } = req.body;

    if (!userId || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Mark user as inactive (soft delete)
    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unified Authenticate - handles both login and signup
export const authenticate = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email }).select('+password');

    if (existingUser) {
      // USER EXISTS - Try to login
      if (!existingUser.isEmailVerified) {
        // Email not verified - generate new OTP and send
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        existingUser.otp = { code: otp, expiresAt: otpExpiresAt };
        await existingUser.save();

        console.log('Sending OTP to unverified user:', email, 'OTP:', otp);
        const emailSent = await sendOTPEmail(email, otp);
        console.log('Email sent result:', emailSent);

        return res.status(200).json({
          success: true,
          action: 'verify',
          message: 'Please verify your email. OTP sent.',
          userId: existingUser._id,
          email: existingUser.email
        });
      }

      if (!existingUser.isActive) {
        return res.status(403).json({ success: false, error: 'Account has been deleted' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid password' });
      }

      // Login successful
      const token = generateToken(existingUser._id);
      return res.json({
        success: true,
        action: 'login',
        message: 'Login successful',
        token,
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email
        }
      });

    } else {
      // USER DOESN'T EXIST - Register new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Create username from email
      const username = email.split('@')[0];

      const user = new User({
        username,
        email,
        password: hashedPassword,
        otp: { code: otp, expiresAt: otpExpiresAt },
        isEmailVerified: false
      });

      await user.save();

      console.log('Sending OTP to new user:', email, 'OTP:', otp);
      const emailSent = await sendOTPEmail(email, otp);
      console.log('Email sent result:', emailSent);

      if (!emailSent) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to send OTP email. Please try again.',
          userId: user._id
        });
      }

      return res.status(201).json({
        success: true,
        action: 'verify',
        message: 'Account created. OTP sent to your email.',
        userId: user._id,
        email: user.email
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
};
