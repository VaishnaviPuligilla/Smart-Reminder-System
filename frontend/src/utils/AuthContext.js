import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data.user);
    } catch (err) {
      setToken(null);
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const register = async (username, email, password, confirmPassword) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.register({
        username,
        email,
        password,
        confirmPassword
      });
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (userId, otp) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.verifyEmail({ userId, otp });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Email verification failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.forgotPassword({ email });
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Request failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (userId, otp, newPassword, confirmPassword) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.resetPassword({
        userId,
        otp,
        newPassword,
        confirmPassword
      });
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password) => {
    setIsLoading(true);
    setError(null);
    try {
      await authAPI.deleteAccount({ password });
      setToken(null);
      localStorage.removeItem('token');
      setUser(null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Account deletion failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        register,
        verifyEmail,
        login,
        forgotPassword,
        resetPassword,
        deleteAccount,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
