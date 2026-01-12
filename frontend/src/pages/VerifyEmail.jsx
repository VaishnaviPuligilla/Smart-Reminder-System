import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../services/api';
import Swal from 'sweetalert2';

export const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { verifyEmail, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = location.state || {};
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes OTP validity
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // 2 minute = 120 seconds cooldown

  useEffect(() => {
    if (!userId || !email) {
      navigate('/auth');
      return;
    }

    // OTP expiry timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, email, navigate]);

  // Cooldown timer for resend button (2 minutes = 120 seconds)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOTP = async () => {
    if (resending || resendCooldown > 0) return;
    
    setResending(true);
    try {
      const response = await authAPI.resendOTP({ email });
      
      if (response.data.success) {
        // Reset the OTP timer
        setTimeLeft(600);
        // Set 2 minute cooldown for resend
        setResendCooldown(120);
        
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent!',
          text: 'A new OTP has been sent to your email.',
          confirmButtonColor: '#667eea'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Resend',
        text: err.response?.data?.error || 'Failed to resend OTP. Please try again.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    const result = await verifyEmail(userId, otp);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Email Verified!',
        text: 'Your email has been verified successfully.',
        confirmButtonColor: '#667eea',
        timer: 2000,
        timerProgressBar: true
      });
      navigate('/dashboard');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: result.error || 'Invalid OTP. Please try again.',
        confirmButtonColor: '#667eea'
      });
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>📧 Verify Email</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          We've sent an OTP to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Enter 6-digit OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (error) setError('');
              }}
              placeholder="000000"
              maxLength="6"
              className={error ? 'error' : ''}
              style={{ fontSize: '28px', letterSpacing: '8px', textAlign: 'center' }}
            />
            {error && <small className="error-text">{error}</small>}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px', color: timeLeft < 60 ? '#ff6b6b' : '#666' }}>
            <strong>OTP expires in: {formatTime(timeLeft)}</strong>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading || timeLeft === 0} style={{ width: '100%' }}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        {/* Resend OTP Section */}
        <div style={{ textAlign: 'center', margin: '25px 0' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Didn't receive the OTP?</p>
          <button 
            onClick={handleResendOTP}
            disabled={resending || resendCooldown > 0}
            className="btn btn-secondary"
            style={{ 
              padding: '10px 25px',
              cursor: resending || resendCooldown > 0 ? 'not-allowed' : 'pointer',
              opacity: resending || resendCooldown > 0 ? 0.6 : 1
            }}
          >
            {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${formatTime(resendCooldown)}` : 'Resend OTP'}
          </button>
          {resendCooldown > 0 && (
            <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
              You can resend OTP after {formatTime(resendCooldown)}
            </p>
          )}
        </div>

        <div className="form-footer">
          <Link to="/auth">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
