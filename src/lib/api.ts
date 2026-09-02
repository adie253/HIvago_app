import axios from "axios";

const BASE_URL = 'https://rally-staging-9ae8.up.railway.app/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customer_token');
    const expiresAt = localStorage.getItem('customer_token_expires_at');
    
    const isTokenValid = () => {
      if (!token) return false;
      if (!expiresAt) return true;
      return new Date(expiresAt).getTime() > Date.now();
    };

    if (token && isTokenValid()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for data handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);
