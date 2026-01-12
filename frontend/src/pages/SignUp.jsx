import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Swal from 'sweetalert2';

export const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.register({
        username: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'Please verify your email with the OTP sent.',
        confirmButtonColor: '#667eea'
      });

      navigate('/verify-email', {
        state: {
          userId: response.data.userId,
          email: formData.email
        }
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      
      if (errorMessage.includes('already exists')) {
        Swal.fire({
          icon: 'warning',
          title: 'User Already Exists',
          text: 'An account with this email already exists. Please sign in.',
          confirmButtonColor: '#667eea',
          confirmButtonText: 'Go to Sign In'
        }).then(() => {
          navigate('/auth');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
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
        <h1>📝 Sign Up</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>
          Create your account to get started.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your name"
            />
            {errors.name && <small className="error-text">{errors.name}</small>}
          </div>

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
              placeholder="At least 6 characters"
            />
            {errors.password && <small className="error-text">{errors.password}</small>}
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
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="form-footer">
          <p>Already have an account? <Link to="/auth">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
