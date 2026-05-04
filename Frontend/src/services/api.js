import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: rawBaseUrl.replace(/\/$/, "") + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;