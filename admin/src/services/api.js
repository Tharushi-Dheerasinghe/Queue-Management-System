import axios from "axios";
import { STORAGE_KEYS } from "../utils/storageKeys";

const ensureApiBaseUrl = (baseUrl) => {
  const normalized = String(baseUrl || "http://localhost:5000").replace(/\/+$/, "");

  if (normalized.endsWith("/api")) {
    return normalized;
  }

  return `${normalized}/api`;
};

const api = axios.create({
  baseURL: ensureApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle 401 Unauthorized (Invalid or expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // Redirect to login page; ProtectedRoute will catch it and direct them to /login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
