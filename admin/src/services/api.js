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

export default api;
