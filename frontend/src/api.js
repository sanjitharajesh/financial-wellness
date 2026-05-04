import axios from "axios";

const BASE = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api`;

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

let _token = null;

export const setAuthToken = (token) => {
  _token = token;
};

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

export const register = (username, password) =>
  api.post("/auth/register/", { username, password });

export const login = (username, password) =>
  api.post("/auth/login/", { username, password });

export const submitAssessment = (answers) => api.post("/score/", answers);

export const fetchProfile = () => api.get("/profile/");
export const saveProfile = (payload) => api.put("/profile/", payload);

export const fetchLatestScore = () => api.get("/score/latest/");
export const fetchStats = () => api.get("/stats/");
export const fetchHistory = () => api.get("/history/");
export const fetchActionItems = () => api.get("/action-items/");
export const saveActionItem = (key, done) => api.post("/action-items/", { key, done });
