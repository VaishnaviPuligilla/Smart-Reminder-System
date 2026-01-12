import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Swal from 'sweetalert2';

export const ResendOTP = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resendOTP({ email });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent',
          text: 'A new OTP has been sent to your email',
          confirmButtonColor: '#667eea'
        }).then(() => {
          // Navigate to verify page with email and userId
          navigate('/verify-email', { 
            state: { 
              userId: response.data.userId, 
              email: email 
            } 
          });
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to resend OTP. Please try again.';
      
      if (errorMessage.includes('already verified')) {
        Swal.fire({
          icon: 'info',
          title: 'Already Verified',
          text: 'Your email is already verified. Please login.',
          confirmButtonColor: '#667eea'
        }).then(() => {
          navigate('/login');
        });
      } else if (errorMessage.includes('not found')) {
        Swal.fire({
          icon: 'error',
          title: 'User Not Found',
          text: 'No account found with this email. Please register first.',
          confirmButtonColor: '#667eea'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: errorMessage,
          confirmButtonColor: '#667eea'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>📧 Resend OTP</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Enter your email to receive a new verification OTP
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="your@email.com"
              className={error ? 'error' : ''}
            />
            {error && <small style={{ color: '#c62828' }}>{error}</small>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login">Back to Login</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default ResendOTP;
