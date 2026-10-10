import axios from 'axios';

// Dynamic API URL: points to live Render backend in production/Vercel, or local proxy in development
export const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When running on Vercel (hostel-managment-khuzdar.vercel.app) or any remote domain, target the live Render backend
  if (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://backend-d1ht.onrender.com/api';
  }
  // Local development fallback
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hostel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify')) {
        localStorage.removeItem('hostel_token');
        localStorage.removeItem('hostel_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
