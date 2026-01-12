import { User } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; fullName: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  verifyOtp: (data: { email: string; otp: string }) =>
    request("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(data) }),

  resendOtp: (data: { email: string; otpType: string }) =>
    request("/api/auth/resend-otp", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  forgotPassword: (data: { email: string }) =>
    request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request("/api/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),

  logout: () => request("/api/auth/logout", { method: "POST" }),

  googleAuth: (credential: string) =>
    request("/api/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),

  // Profile
  getProfile: () => request<User>("/api/users/me"),

  updateProfile: (data: Partial<User>) =>
    request<User>("/api/users/me", { method: "PUT", body: JSON.stringify(data) }),
};
