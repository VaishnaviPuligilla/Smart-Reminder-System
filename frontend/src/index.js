import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import { AuthProvider } from './context/AuthContext';

// Function to apply theme
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

// Initialize theme
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  return savedTheme;
};

const RootComponent = () => {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);