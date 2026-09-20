import axios from 'axios';

// Base URL of the Spring Boot backend. Defaults to current origin in monolith deployment.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:8081'
    : (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:8081'));

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach auth token (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('vayu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors and guard against SPA fallback HTML strings
client.interceptors.response.use(
  (response) => {
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!doctype') ||
       response.data.trim().startsWith('<!DOCTYPE') ||
       response.data.trim().startsWith('<html'))
    ) {
      const err = new Error('Received HTML response instead of JSON API response from server');
      err.response = response;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the API server at ' + API_BASE_URL + '. Confirm the backend is running on port 8081.'
        : error.message) ||
      'Something went wrong.';
    return Promise.reject({ ...error, message });
  }
);

export default client;
