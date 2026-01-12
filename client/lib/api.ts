import { User } from "@/types/user";
import { Job, Page, CreateJobRequest, UpdateJobRequest, JobStatus } from "@/types/job";
import { Payment, PaymentStatus } from "@/types/payment";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResponse<T> {
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

  // Roles
  becomeEmployer: () => request<User>("/api/users/me/become-employer", { method: "POST" }),

  // Jobs
  // Tạo job mới (DRAFT)
  createJob: (data: CreateJobRequest) =>
    request<Job>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),

  // Lấy danh sách jobs đang tuyển (công khai)
  getOpenJobs: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    if (params?.sortBy) query.append("sortBy", params.sortBy);
    if (params?.sortDir) query.append("sortDir", params.sortDir);
    return request<Page<Job>>(`/api/jobs${query.toString() ? `?${query}` : ""}`);
  },

  // Lấy chi tiết job
  getJobById: (id: number) => request<Job>(`/api/jobs/${id}`),

  // Lấy danh sách jobs của tôi (employer)
  getMyJobs: (params?: { status?: JobStatus; page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    if (params?.sortBy) query.append("sortBy", params.sortBy);
    if (params?.sortDir) query.append("sortDir", params.sortDir);
    return request<Page<Job>>(`/api/jobs/my-jobs${query.toString() ? `?${query}` : ""}`);
  },

  // Tìm kiếm jobs
  searchJobs: (params: { keyword: string; page?: number; size?: number }) => {
    const query = new URLSearchParams({ keyword: params.keyword });
    if (params.page !== undefined) query.append("page", params.page.toString());
    if (params.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Job>>(`/api/jobs/search?${query}`);
  },

  // Tìm jobs theo skills
  getJobsBySkills: (params: { skills: string[]; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    params.skills.forEach((skill) => query.append("skills", skill));
    if (params.page !== undefined) query.append("page", params.page.toString());
    if (params.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Job>>(`/api/jobs/by-skills?${query}`);
  },

  // Cập nhật job
  updateJob: (id: number, data: UpdateJobRequest) =>
    request<Job>(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Đóng tin tuyển dụng
  closeJob: (id: number) =>
    request<Job>(`/api/jobs/${id}/close`, { method: "PATCH" }),

  // Xóa job
  deleteJob: (id: number) =>
    request<void>(`/api/jobs/${id}`, { method: "DELETE" }),

  // Payments
  // Tạo thanh toán cho job
  createPayment: (jobId: number) =>
    request<Payment>(`/api/payments/jobs/${jobId}`, { method: "POST" }),

  // Query trạng thái thanh toán
  queryPaymentStatus: (appTransId: string) =>
    request<Payment>(`/api/payments/query/${appTransId}`),

  // Lấy payment của job
  getPaymentByJobId: (jobId: number) =>
    request<Payment>(`/api/payments/jobs/${jobId}`),

  // Lấy lịch sử thanh toán của tôi
  getMyPayments: (params?: { status?: PaymentStatus; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Payment>>(`/api/payments/my-payments${query.toString() ? `?${query}` : ""}`);
  },
};
