import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (password !== confirmPassword) {
        return setError("Passwords don't match");
      }
      
      setLoading(true);
      try {
        const res = await api.post('/auth/register', { email, password });
        setUserId(res.data.userId);
        setStep(2);
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const res = await api.post('/auth/verify-otp', { userId, otp });
        localStorage.setItem('token', res.data.token);
        
        // Set token expiry for 30 minutes
        const tokenExpiry = new Date();
        tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30);
        localStorage.setItem('tokenExpiry', tokenExpiry.toISOString());
        
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'OTP verification failed');
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
              <h2 className="text-center mb-4">{step === 1 ? 'Register' : 'Verify Email'}</h2>
              {error && (
                <div className="alert alert-danger">
                  {error}
                  {error.includes('Password must be') && (
                    <div className="mt-2">
                      <small>
                        Password requirements:
                        <ul>
                          <li>At least 8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One number</li>
                          <li>One special character (@, $, !, %, *, ?, #, &)</li>
                        </ul>
                      </small>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {step === 1 ? (
                  <>
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
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Must include uppercase, number, and special character"
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
                ) : (
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
                        placeholder="Enter the OTP sent to your email"
                      />
                    </div>
                    <div className="mb-3">
                      <button type="button" className="btn btn-link p-0" onClick={resendOtp}>
                        Resend OTP
                      </button>
                    </div>
                  </>
                )}
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Processing...' : (step === 1 ? 'Register' : 'Verify')}
                </button>
              </form>
              <div className="text-center mt-3">
                <Link to="/login">Already have an account? Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;