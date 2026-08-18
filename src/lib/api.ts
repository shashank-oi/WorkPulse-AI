import axios from "axios";

/**
 * WorkPulse AI REST client.
 *
 * Talks to the Spring Boot backend (Spring Security + JWT). The token is
 * stored in localStorage and attached to every request; a 401 clears it and
 * bounces the user to /auth, preserving where they were headed.
 */

export const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080/api"
);

export const TOKEN_KEY = "workpulse_token";

// --- API types (mirror the backend DTOs) ---

export interface User {
  id: number;
  name: string | null;
  email: string;
  role: "admin" | "user";
  status: "active" | "invited";
  companyId: number | null;
  companyName: string | null;
  companyCode: string | null;
  joinedAt: number;
}

export interface Company {
  id: number;
  name: string;
  code: string;
}

export interface Member {
  id: number;
  name: string | null;
  email: string;
  role: "admin" | "user";
  status: "active" | "invited";
  joinedAt: number;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  clockIn: number; // epoch ms
  clockOut: number | null;
  name?: string;
  email?: string;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: "annual" | "sick" | "personal" | "unpaid" | "other";
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string | null;
  createdAt: number;
  reviewedAt?: number | null;
  name?: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --- axios instance ---

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith("/auth")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return Promise.reject(error);
  },
);

/** Turn an axios error into a friendly message for toasts/inline errors. */
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.response?.status === 401) return "Please log in again";
    if (error.code === "ERR_NETWORK") {
      return "Can't reach the WorkPulse server. Is the backend running on port 8080?";
    }
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export default api;
