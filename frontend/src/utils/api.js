import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = localStorage.getItem('token');
        const response = await api.post('/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const { token: newToken } = response.data;
        
        // Update token and expiry
        const tokenExpiry = new Date();
        tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('tokenExpiry', tokenExpiry.toISOString());
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;