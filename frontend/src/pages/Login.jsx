import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import Swal from 'sweetalert2';
import bgImage from '../assets/bg2.jpg';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: `Welcome back, ${result.data.user.username}!`,
        confirmButtonColor: '#667eea'
      });
      navigate('/dashboard');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: result.error,
        confirmButtonColor: '#667eea'
      });
    }
  };

  return (
    <div className="auth-container" style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      <div className="auth-form">
        <h1>🔑 Login</h1>
        <form onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <small style={{ color: '#c62828' }}>{errors.password}</small>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="form-footer">
          Don't have an account? <Link to="/register">Register here</Link><br />
          <Link to="/forgot-password">Forgot Password?</Link><br />
          <Link to="/resend-otp">Resend Verification OTP</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
