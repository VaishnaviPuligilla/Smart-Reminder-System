import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="spinner"></div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth" />;
};

export default PrivateRoute;
