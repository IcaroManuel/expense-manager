import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";
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
      // Verifica se estamos no cliente para evitar erros de SSR no Next.js
      if (typeof window !== "undefined") {
        const here = window.location.pathname;
        const hasSessionFragment = window.location.hash?.includes("session_id=");
        if (here !== "/login" && !hasSessionFragment) {
          // Defer to avoid mid-render redirect loops
          setTimeout(() => {
            window.location.href = "/login";
          }, 50);
        }
      }
    }
    return Promise.reject(err);
  }
);

export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const loginApi = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const registerApi = (email: string, name: string, password: string) =>
  api.post("/auth/register", { email, name, password }).then((r) => r.data);

export const setInitialPasswordApi = (email: string, name: string, password: string) =>
  api.post("/auth/set-initial-password", { email, name, password }).then((r) => r.data);

export const logoutApi = () => api.post("/auth/logout").then((r) => r.data);

export const exchangeSession = (sessionId: string) =>
  api.post("/auth/session", { session_id: sessionId }).then((r) => r.data);

export const fetchCategories = () =>
  api.get("/categories").then((r) => r.data);

export const createCategory = (payload: any) =>
  api.post("/categories", payload).then((r) => r.data);

export const updateCategory = (id: string, payload: any) =>
  api.patch(`/categories/${id}`, payload).then((r) => r.data);

export const deleteCategory = (id: string) =>
  api.delete(`/categories/${id}`);

export const fetchBillings = (year: number, month: number) =>
  api.get("/billings", { params: { year, month } }).then((r) => r.data);

export const createBilling = (payload: any) =>
  api.post("/billings", payload).then((r) => r.data);

export const updateBilling = (id: string | number, payload: any, year: number, month: number) =>
  api
    .patch(`/billings/${id}`, payload, { params: { year, month } })
    .then((r) => r.data);

export const deleteBilling = (id: string | number, year: number, month: number, scope = "month") =>
  api.delete(`/billings/${id}`, { params: { year, month, scope } });

export const fetchExpenses = (year: number, month: number) =>
  api.get("/expenses", { params: { year, month } }).then((r) => r.data);

export const createExpense = (payload: any) =>
  api.post("/expenses", payload).then((r) => r.data);

export const updateExpense = (id: string | number, payload: any, year: number, month: number) =>
  api
    .patch(`/expenses/${id}`, payload, { params: { year, month } })
    .then((r) => r.data);

export const deleteExpense = (id: string | number, year: number, month: number, scope = "month") =>
  api.delete(`/expenses/${id}`, { params: { year, month, scope } });

export const fetchSummary = (year: number, month: number) =>
  api.get("/summary", { params: { year, month } }).then((r) => r.data);

export const fetchInvestmentsSummary = () =>
  api.get("/investments/summary").then((r) => r.data);

export const fetchYieldHistory = () =>
  api.get("/investments/yield-history").then((r) => r.data);

export const fetchInvestmentTransactions = () =>
  api.get("/investments/transactions").then((r) => r.data);

export const createInvestmentSnapshot = (payload: {
  year: number;
  month: number;
  value: number;
}) => api.post("/investments/snapshots", payload).then((r) => r.data);

export const createInvestmentTransaction = (payload: {
  type: "DEPOSIT" | "WITHDRAWAL";
  value: number;
  year: number;
  month: number;
  day: number;
  note?: string;
}) => api.post("/investments/transactions", payload).then((r) => r.data);

export const deleteInvestmentTransaction = (id: string) =>
  api.delete(`/investments/transactions/${id}`);

export const fetchAnnualSummary = (year: number) =>
  api.get(`/summary/annual?year=${year}`).then((r) => r.data);
