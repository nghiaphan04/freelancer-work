import { User } from "@/types/user";
import { Job, Page, CreateJobRequest, UpdateJobRequest, JobStatus, JobHistory } from "@/types/job";
import { BalanceDeposit, DepositStatus, BalanceStatistics } from "@/types/balance";

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

  // Chuyển đổi trạng thái (DRAFT <-> OPEN)
  toggleJobStatus: (id: number) =>
    request<Job>(`/api/jobs/${id}/toggle-status`, { method: "PATCH" }),

  // Xóa job
  deleteJob: (id: number) =>
    request<void>(`/api/jobs/${id}`, { method: "DELETE" }),

  // Job Applications
  applyJob: (jobId: number, data: { coverLetter?: string }) =>
    request<JobApplication>(`/api/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify(data) }),

  getMyApplicationForJob: (jobId: number) =>
    request<JobApplication | null>(`/api/jobs/${jobId}/my-application`),

  getMyApplications: (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<JobApplication>>(`/api/jobs/my-applications${query.toString() ? `?${query}` : ""}`);
  },

  getJobApplications: (jobId: number) =>
    request<JobApplication[]>(`/api/jobs/${jobId}/applications`),

  acceptApplication: (jobId: number, applicationId: number) =>
    request<JobApplication>(`/api/jobs/${jobId}/applications/${applicationId}/accept`, { method: "PATCH" }),

  rejectApplication: (jobId: number, applicationId: number) =>
    request<JobApplication>(`/api/jobs/${jobId}/applications/${applicationId}/reject`, { method: "PATCH" }),

  // Job History
  getJobHistory: (jobId: number) =>
    request<JobHistory[]>(`/api/jobs/${jobId}/history`),

  getJobHistoryPaged: (jobId: number, params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<JobHistory>>(`/api/jobs/${jobId}/history/paged${query.toString() ? `?${query}` : ""}`);
  },

  // Balance - Nạp số dư
  createDeposit: (amount: number) =>
    request<BalanceDeposit>("/api/balance/deposit", { method: "POST", body: JSON.stringify({ amount }) }),

  // Query trạng thái nạp tiền
  queryDepositStatus: (appTransId: string) =>
    request<BalanceDeposit>(`/api/balance/deposit/${appTransId}/status`),

  // Lấy lịch sử nạp tiền của tôi
  getMyDeposits: (params?: { status?: DepositStatus; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<BalanceDeposit>>(`/api/balance/my-deposits${query.toString() ? `?${query}` : ""}`);
  },

  // Credits - Mua credit bằng số dư
  getCreditPackages: () => request<CreditPackage[]>("/api/credits/packages"),

  purchaseCredits: (creditPackage: string) =>
    request<CreditPurchase>("/api/credits/purchase", { method: "POST", body: JSON.stringify({ creditPackage }) }),

  getMyCreditPurchases: (params?: { status?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<CreditPurchase>>(`/api/credits/my-purchases${query.toString() ? `?${query}` : ""}`);
  },

  // Saved Jobs (Công việc đã lưu)
  saveJob: (jobId: number) =>
    request<SavedJob>(`/api/saved-jobs/${jobId}`, { method: "POST" }),

  unsaveJob: (jobId: number) =>
    request<void>(`/api/saved-jobs/${jobId}`, { method: "DELETE" }),

  toggleSaveJob: (jobId: number) =>
    request<SavedJob | null>(`/api/saved-jobs/${jobId}/toggle`, { method: "POST" }),

  getSavedJobs: (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<SavedJob>>(`/api/saved-jobs${query.toString() ? `?${query}` : ""}`);
  },

  getSavedJobIds: () =>
    request<number[]>("/api/saved-jobs/ids"),

  isJobSaved: (jobId: number) =>
    request<boolean>(`/api/saved-jobs/${jobId}/check`),

  // ADMIN 

  // Admin - Users
  adminGetAllUsers: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    if (params?.sortBy) query.append("sortBy", params.sortBy);
    if (params?.sortDir) query.append("sortDir", params.sortDir);
    return request<Page<User>>(`/api/users${query.toString() ? `?${query}` : ""}`);
  },

  adminGetUserById: (id: number) => request<User>(`/api/users/${id}`),

  adminUpdateUserStatus: (id: number, enabled: boolean) =>
    request<User>(`/api/users/${id}/status`, { method: "PUT", body: JSON.stringify({ enabled }) }),

  // Admin - Balance (Nạp tiền)
  adminGetBalanceStatistics: () =>
    request<BalanceStatistics>("/api/admin/balance/statistics"),

  adminGetAllDeposits: (params?: { status?: DepositStatus; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<BalanceDeposit>>(`/api/admin/balance${query.toString() ? `?${query}` : ""}`);
  },

  // Admin - Job Approval (Kiểm duyệt job)
  adminGetPendingJobs: (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Job>>(`/api/jobs/admin/pending${query.toString() ? `?${query}` : ""}`);
  },

  adminGetJobsByStatus: (status: JobStatus, params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Job>>(`/api/jobs/admin/status/${status}${query.toString() ? `?${query}` : ""}`);
  },

  adminApproveJob: (jobId: number) =>
    request<Job>(`/api/jobs/admin/${jobId}/approve`, { method: "PUT" }),

  adminRejectJob: (jobId: number, reason: string) =>
    request<Job>(`/api/jobs/admin/${jobId}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),

  adminCountPendingJobs: () =>
    request<number>("/api/jobs/admin/count/pending"),

  // Notifications
  getNotifications: () =>
    request<Notification[]>("/api/notifications"),

  getNotificationsPaged: (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Notification>>(`/api/notifications/paged${query.toString() ? `?${query}` : ""}`);
  },

  getUnreadNotificationCount: () =>
    request<number>("/api/notifications/unread-count"),

  markNotificationAsRead: (id: number) =>
    request<void>(`/api/notifications/${id}/read`, { method: "PATCH" }),

  markAllNotificationsAsRead: () =>
    request<void>("/api/notifications/read-all", { method: "PATCH" }),
};

// Notification types
export type NotificationType =
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "NEW_APPLICATION"
  | "JOB_APPROVED"
  | "JOB_REJECTED"
  | "SYSTEM";

export interface Notification {
  id: number;
  type: NotificationType;
  typeLabel: string;
  title: string;
  message?: string;
  referenceId?: number;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  APPLICATION_ACCEPTED: { icon: "check_circle", color: "text-green-600" },
  APPLICATION_REJECTED: { icon: "cancel", color: "text-red-600" },
  NEW_APPLICATION: { icon: "person_add", color: "text-blue-600" },
  JOB_APPROVED: { icon: "verified", color: "text-green-600" },
  JOB_REJECTED: { icon: "block", color: "text-red-600" },
  SYSTEM: { icon: "info", color: "text-gray-600" },
};

// Credit types
export interface CreditPackage {
  packageId: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  originalPrice: number;
  discountPercent: number;
  description: string;
}

export interface CreditPurchase {
  id: number;
  appTransId: string;
  userId: number;
  userFullName?: string;
  creditPackage: string;
  creditsAmount: number;
  totalAmount: number;
  currency: string;
  description?: string;
  status: string;
  creditsGranted: boolean;
  paidAt?: string;
  createdAt: string;
}

// Job Application types
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export interface JobApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  freelancer: {
    id: number;
    fullName: string;
    avatarUrl?: string;
    phoneNumber?: string;
    bio?: string;
    skills?: string[];
  };
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

// Saved Job types
export interface SavedJob {
  id: number;
  jobId: number;
  jobTitle: string;
  jobDescription: string;
  jobBudget: number;
  jobStatus: string;
  jobSkills: string[];
  employer: {
    id: number;
    fullName: string;
    company?: string;
    location?: string;
    avatarUrl?: string;
  };
  savedAt: string;
}
