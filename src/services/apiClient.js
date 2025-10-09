import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const apiClient = axios.create({
  baseURL: '/',
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
