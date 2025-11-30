import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      setLoading(true);
      try {
        const res = await api.post('/auth/forgot-password', { email });
        setUserId(res.data.userId);
        setStep(2);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setLoading(true);
      try {
        await api.post('/auth/verify-otp', { userId, otp });
        setStep(3);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid OTP');
      } finally {
        setLoading(false);
      }
    } else {
      if (newPassword !== confirmPassword) {
        return setError("Passwords don't match");
      }
      
      setLoading(true);
      try {
        await api.post('/auth/reset-password', { userId, otp, newPassword });
        alert('Password reset successfully. Please login with your new password.');
        window.location.href = '/login';
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  };

  const resendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      alert('New OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">
                {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
              </h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                )}
                {step === 2 && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="otp" className="form-label">OTP</label>
                      <input
                        type="text"
                        className="form-control"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <button type="button" className="btn btn-link p-0" onClick={resendOtp}>
                        Resend OTP
                      </button>
                    </div>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Processing...' : 
                    (step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset Password')}
                </button>
              </form>
              <div className="text-center mt-3">
                <Link to="/login">Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;