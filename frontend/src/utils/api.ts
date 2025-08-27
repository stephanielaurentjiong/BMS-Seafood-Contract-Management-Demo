/**
 * API Utilities - HTTP Client Setup
 * 
 * Purpose: Centralized HTTP client for talking to your backend (like Python's requests session).
 */

import axios from "axios";
import { AuthResponse, LoginData, RegisterData } from "../types";


// Default setting for making requests session
const API_BASE_URL = "http://localhost:3001/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Purpose: Every API call automatically includes your auth token if you're logged in.
 */
// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Add JWT token
  }
  return config;
});

/**
 * Purpose: 
 */
// Handle token expiration and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user automatically
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (data: LoginData) => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterData) =>
    api.post<AuthResponse>("/auth/register", data),
};

// Health check
export const healthCheck = () => api.get("/health");

export default api;
