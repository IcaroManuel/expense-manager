import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err?.response?.status === 401) {
      const here = window.location.pathname;
      const hasSessionFragment = window.location.hash?.includes("session_id=");
      if (here !== "/login" && !hasSessionFragment) {
        // Defer to avoid mid-render redirect loops
        setTimeout(() => {
          window.location.href = "/login";
        }, 50);
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const exchangeSession = (sessionId) =>
  api.post("/auth/session", { session_id: sessionId }).then((r) => r.data);
export const logoutApi = () => api.post("/auth/logout").then((r) => r.data);

// Billings
export const fetchBillings = (year, month) =>
  api.get("/billings", { params: { year, month } }).then((r) => r.data);

export const createBilling = (payload) =>
  api.post("/billings", payload).then((r) => r.data);

export const updateBilling = (id, payload, year, month) =>
  api
    .patch(`/billings/${id}`, payload, { params: { year, month } })
    .then((r) => r.data);

export const deleteBilling = (id, year, month, scope = "month") =>
  api.delete(`/billings/${id}`, { params: { year, month, scope } });

// Expenses
export const fetchExpenses = (year, month) =>
  api.get("/expenses", { params: { year, month } }).then((r) => r.data);

export const createExpense = (payload) =>
  api.post("/expenses", payload).then((r) => r.data);

export const updateExpense = (id, payload, year, month) =>
  api
    .patch(`/expenses/${id}`, payload, { params: { year, month } })
    .then((r) => r.data);

export const deleteExpense = (id, year, month, scope = "month") =>
  api.delete(`/expenses/${id}`, { params: { year, month, scope } });

// Summary
export const fetchSummary = (year, month) =>
  api.get("/summary", { params: { year, month } }).then((r) => r.data);
