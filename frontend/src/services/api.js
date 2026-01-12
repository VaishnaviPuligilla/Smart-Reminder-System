import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  authenticate: (data) => API.post('/auth/authenticate', data),
  register: (data) => API.post('/auth/register', data),
  verifyEmail: (data) => API.post('/auth/verify-email', data),
  resendOTP: (data) => API.post('/auth/resend-otp', data),
  login: (data) => API.post('/auth/login', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getProfile: () => API.get('/auth/profile'),
  deleteAccount: (data) => API.delete('/auth/account', { data })
};

// Reminders API
export const remindersAPI = {
  createReminder: (data) => API.post('/reminders/create', data),
  getReminders: () => API.get('/reminders/all'),
  getDeletedReminders: () => API.get('/reminders/deleted'),
  updateReminder: (id, data) => API.put(`/reminders/update/${id}`, data),
  softDeleteReminder: (id) => API.delete(`/reminders/soft-delete/${id}`),
  permanentlyDeleteReminder: (id) => API.delete(`/reminders/permanent-delete/${id}`),
  getStats: () => API.get('/reminders/stats')
};

export default API;
