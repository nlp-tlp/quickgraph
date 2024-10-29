// /shared/api/axiosInstance.js

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Custom error for missing token
class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "TokenError";
  }
}

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new TokenError("No authentication token found");
      }

      // Add token to headers
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (error) {
      // Handle specific errors
      if (error instanceof TokenError) {
        return Promise.reject(error);
      }
      // Handle other errors (e.g., localStorage not available)
      return Promise.reject(
        new Error("Failed to configure request authentication")
      );
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem("token");

      // You might want to redirect to login page here
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
