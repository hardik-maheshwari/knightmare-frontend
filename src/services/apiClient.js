import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const apiClient = axios.create({
  // 2. Use it! If it exists, use it; otherwise default to '/' (local dev with proxy)
  baseURL: BACKEND_URL || "/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
