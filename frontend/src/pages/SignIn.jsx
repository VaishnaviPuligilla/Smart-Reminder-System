import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import Swal from 'sweetalert2';

export const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: `Hello, ${result.data.user.username}!`,
          timer: 1500,
          showConfirmButton: false
        });
        navigate('/dashboard');
      } else {
        // Handle different error types
        const errorMessage = result.error || 'Login failed';
        
        if (errorMessage.includes('verify your email')) {
          Swal.fire({
            icon: 'info',
            title: 'Email Not Verified',
            text: 'Please verify your email first.',
            confirmButtonColor: '#667eea'
          });
        } else if (errorMessage.includes('Invalid')) {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Invalid email or password',
            confirmButtonColor: '#667eea'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: errorMessage,
            confirmButtonColor: '#667eea'
          });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        confirmButtonColor: '#667eea'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>🔑 Sign In</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>
          Welcome back! Please sign in to continue.
        </p>
        
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
            {errors.email && <small className="error-text">{errors.email}</small>}
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
            {errors.password && <small className="error-text">{errors.password}</small>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="form-footer">
          <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
