import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import Swal from 'sweetalert2';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp & password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userId, setUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const { forgotPassword, resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await forgotPassword(formData.email);

    if (result.success) {
      setUserId(result.data.userId);
      setStep(2);
      Swal.fire({
        icon: 'success',
        title: 'OTP Sent',
        text: 'Check your email for the OTP',
        confirmButtonColor: '#667eea'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: result.error,
        confirmButtonColor: '#667eea'
      });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await resetPassword(userId, formData.otp, formData.newPassword, formData.confirmPassword);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Password Reset',
        text: 'Your password has been reset successfully',
        confirmButtonColor: '#667eea'
      });
      navigate('/login');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Reset Failed',
        text: result.error,
        confirmButtonColor: '#667eea'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>🔐 Forgot Password</h1>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email"
              />
              {errors.email && <small style={{ color: '#c62828' }}>{errors.email}</small>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="otp">OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData(prev => ({ ...prev, otp: val }));
                  if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
                }}
                className={errors.otp ? 'error' : ''}
                placeholder="000000"
                maxLength="6"
              />
              {errors.otp && <small style={{ color: '#c62828' }}>{errors.otp}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? 'error' : ''}
                placeholder="Enter new password"
              />
              {errors.newPassword && <small style={{ color: '#c62828' }}>{errors.newPassword}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && <small style={{ color: '#c62828' }}>{errors.confirmPassword}</small>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="form-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
