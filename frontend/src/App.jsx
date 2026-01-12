import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Import pages
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';

// Import styles
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/auth" />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
