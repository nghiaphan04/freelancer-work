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
  
  const data = await res.json();
  
  // Log for debugging
  if (!res.ok) {
    console.error(`API Error [${res.status}] ${endpoint}:`, data);
  }
  
  return data;
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

  // Lấy danh sách jobs đang làm của freelancer
  getMyWorkingJobs: (params?: { status?: JobStatus; page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    if (params?.sortBy) query.append("sortBy", params.sortBy);
    if (params?.sortDir) query.append("sortDir", params.sortDir);
    return request<Page<Job>>(`/api/jobs/my-working-jobs${query.toString() ? `?${query}` : ""}`);
  },

  // Lấy thống kê jobs của freelancer
  getMyWorkingJobsStats: () =>
    request<{ inProgress: number; completed: number; disputed: number; totalEarnings: number }>("/api/jobs/my-working-jobs/stats"),

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
    request<JobApplication>(`/api/jobs/applications/${applicationId}/accept`, { method: "PUT" }),

  rejectApplication: (jobId: number, applicationId: number) =>
    request<JobApplication>(`/api/jobs/applications/${applicationId}/reject`, { method: "PUT" }),

  withdrawApplication: (applicationId: number) =>
    request<void>(`/api/jobs/applications/${applicationId}`, { method: "DELETE" }),

  // Job History
  getJobHistory: (jobId: number) =>
    request<JobHistory[]>(`/api/jobs/${jobId}/history`),

  getJobHistoryPaged: (jobId: number, params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<JobHistory>>(`/api/jobs/${jobId}/history/paged${query.toString() ? `?${query}` : ""}`);
  },

  // Work Submission
  submitWork: (jobId: number, data: { url: string; note?: string }) =>
    request<JobApplication>(`/api/jobs/${jobId}/work/submit`, { method: "POST", body: JSON.stringify(data) }),

  approveWork: (jobId: number) =>
    request<JobApplication>(`/api/jobs/${jobId}/work/approve`, { method: "PUT" }),

  requestRevision: (jobId: number, note: string) =>
    request<JobApplication>(`/api/jobs/${jobId}/work/revision`, { method: "PUT", body: JSON.stringify({ note }) }),

  getWorkSubmission: (jobId: number) =>
    request<JobApplication | null>(`/api/jobs/${jobId}/work`),

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

  adminGrantCredits: (id: number, amount: number) =>
    request<User>(`/api/users/${id}/credits`, { method: "POST", body: JSON.stringify({ amount }) }),

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

  // Admin - Disputes (TH3)
  adminGetPendingDisputes: (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<Dispute>>(`/api/admin/disputes${query.toString() ? `?${query}` : ""}`);
  },

  adminCountPendingDisputes: () =>
    request<number>("/api/admin/disputes/count"),

  adminRequestDisputeResponse: (disputeId: number, daysToRespond?: number) =>
    request<Dispute>(`/api/admin/disputes/${disputeId}/request-response`, {
      method: "PUT",
      body: JSON.stringify({ daysToRespond: daysToRespond || 3 }),
    }),

  adminResolveDispute: (disputeId: number, employerWins: boolean, note: string) =>
    request<Dispute>(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "PUT",
      body: JSON.stringify({ employerWins, note }),
    }),

  // Disputes - Employer
  createDispute: (
    jobId: number,
    description: string,
    evidenceUrl: string,
    fileId?: number
  ) =>
    request<Dispute>(`/api/jobs/${jobId}/disputes`, {
      method: "POST",
      body: JSON.stringify({ description, evidenceUrl, fileId }),
    }),

  getDispute: (jobId: number) =>
    request<Dispute | null>(`/api/jobs/${jobId}/disputes`),

  // Disputes - Freelancer
  submitDisputeResponse: (
    disputeId: number,
    description: string,
    evidenceUrl: string,
    fileId?: number
  ) =>
    request<Dispute>(`/api/disputes/${disputeId}/respond`, {
      method: "PUT",
      body: JSON.stringify({ description, evidenceUrl, fileId }),
    }),

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

  // Withdrawal Requests
  createFreelancerWithdrawal: (jobId: number, reason: string) =>
    request<WithdrawalRequest>(`/api/jobs/${jobId}/withdrawal/freelancer`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  createEmployerCancellation: (jobId: number, reason: string) =>
    request<WithdrawalRequest>(`/api/jobs/${jobId}/withdrawal/employer`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  approveWithdrawalRequest: (jobId: number, requestId: number, message?: string) =>
    request<WithdrawalRequest>(`/api/jobs/${jobId}/withdrawal/${requestId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ message }),
    }),

  rejectWithdrawalRequest: (jobId: number, requestId: number, message?: string) =>
    request<WithdrawalRequest>(`/api/jobs/${jobId}/withdrawal/${requestId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ message }),
    }),

  cancelWithdrawalRequest: (jobId: number, requestId: number) =>
    request<void>(`/api/jobs/${jobId}/withdrawal/${requestId}`, { method: "DELETE" }),

  getPendingWithdrawalRequest: (jobId: number) =>
    request<WithdrawalRequest | null>(`/api/jobs/${jobId}/withdrawal/pending`),

  getWithdrawalRequestHistory: (jobId: number) =>
    request<WithdrawalRequest[]>(`/api/jobs/${jobId}/withdrawal/history`),

  // ==================== CHAT ====================
  
  // Search users to add friend
  chatSearchUsers: (email: string) =>
    request<ChatUserSearchResult[]>(`/api/chat/users/search?email=${encodeURIComponent(email)}`),

  // Send chat request (first message to add friend)
  sendChatRequest: (receiverId: number, message: string) =>
    request<ChatConversation>("/api/chat/request", {
      method: "POST",
      body: JSON.stringify({ receiverId, message }),
    }),

  // Get pending requests (received from others)
  getPendingChatRequests: () =>
    request<ChatConversation[]>("/api/chat/requests/pending"),

  // Get sent requests (waiting for accept)
  getSentChatRequests: () =>
    request<ChatConversation[]>("/api/chat/requests/sent"),

  // Accept chat request
  acceptChatRequest: (conversationId: number) =>
    request<ChatConversation>(`/api/chat/requests/${conversationId}/accept`, { method: "POST" }),

  // Reject chat request
  rejectChatRequest: (conversationId: number) =>
    request<void>(`/api/chat/requests/${conversationId}/reject`, { method: "POST" }),

  // Cancel sent chat request (hủy yêu cầu đã gửi)
  cancelChatRequest: (conversationId: number) =>
    request<void>(`/api/chat/requests/${conversationId}/cancel`, { method: "POST" }),

  // Get all accepted conversations
  getConversations: () =>
    request<ChatConversation[]>("/api/chat/conversations"),

  // Get messages for a conversation
  getMessages: (conversationId: number, params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    return request<Page<ChatMessage>>(`/api/chat/conversations/${conversationId}/messages${query.toString() ? `?${query}` : ""}`);
  },

  // Mark messages as read
  markMessagesAsRead: (conversationId: number) =>
    request<void>(`/api/chat/conversations/${conversationId}/read`, { method: "POST" }),

  // Send message (REST fallback)
  sendMessage: (receiverId: number, content: string, messageType: ChatMessageType = "TEXT", replyToId?: number, fileId?: number) =>
    request<ChatMessage>("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ receiverId, content, messageType, replyToId, fileId }),
    }),

  // Update message
  updateMessage: (messageId: number, content: string) =>
    request<ChatMessage>(`/api/chat/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  // Delete message
  deleteMessage: (messageId: number) =>
    request<ChatMessage>(`/api/chat/messages/${messageId}`, { method: "DELETE" }),

  // Get chat counts (unread + pending requests)
  getChatCounts: () =>
    request<{ unreadMessages: number; pendingRequests: number }>("/api/chat/counts"),

  // Block user
  blockUser: (conversationId: number) =>
    request<void>(`/api/chat/conversations/${conversationId}/block`, { method: "POST" }),

  unblockUser: (conversationId: number) =>
    request<ChatConversation>(`/api/chat/conversations/${conversationId}/unblock`, { method: "POST" }),

  // ==================== FILE UPLOAD ====================
  
  // Upload image (max 200KB)
  uploadImage: async (file: File, usage: string): Promise<ApiResponse<FileUploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("usage", usage);
    
    const res = await fetch(`${API_URL}/api/files/image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    return res.json();
  },

  // Upload document (max 5MB)
  uploadDocument: async (file: File, usage: string): Promise<ApiResponse<FileUploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("usage", usage);
    
    const res = await fetch(`${API_URL}/api/files/document`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    return res.json();
  },

  // Upload file (auto detect type)
  uploadFile: async (file: File, usage: string): Promise<ApiResponse<FileUploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("usage", usage);
    
    const res = await fetch(`${API_URL}/api/files`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    return res.json();
  },

  // Delete file
  deleteFile: (fileId: number) =>
    request<void>(`/api/files/${fileId}`, { method: "DELETE" }),

};

// ==================== FILE UPLOAD TYPES ====================
export interface FileUploadResponse {
  id: number;
  publicId: string;
  url: string;
  secureUrl: string;
  originalFilename: string;
  fileType: "IMAGE" | "DOCUMENT";
  mimeType: string;
  format: string;
  sizeBytes: number;
  readableSize: string;
  width?: number;
  height?: number;
  usage: string;
  referenceType?: string;
  referenceId?: number;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
}

// Withdrawal Request types
export type WithdrawalRequestType = "FREELANCER_WITHDRAW" | "EMPLOYER_CANCEL";
export type WithdrawalRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface WithdrawalRequest {
  id: number;
  jobId: number;
  jobTitle: string;
  type: WithdrawalRequestType;
  typeLabel: string;
  status: WithdrawalRequestStatus;
  statusLabel: string;
  reason: string;
  penaltyFee: number;
  penaltyPercent: number;
  responseMessage?: string;
  requester: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  responder?: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  respondedAt?: string;
  createdAt: string;
}

export const WITHDRAWAL_REQUEST_TYPE_CONFIG: Record<WithdrawalRequestType, { label: string; icon: string }> = {
  FREELANCER_WITHDRAW: { label: "Freelancer xin rút", icon: "exit_to_app" },
  EMPLOYER_CANCEL: { label: "Bên thuê xin hủy", icon: "cancel" },
};

export const WITHDRAWAL_REQUEST_STATUS_CONFIG: Record<WithdrawalRequestStatus, { label: string; color: string }> = {
  PENDING: { label: "Đang chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Đã chấp nhận", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Đã từ chối", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Đã hủy yêu cầu", color: "bg-gray-100 text-gray-700" },
};

// Notification types
export type NotificationType =
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "NEW_APPLICATION"
  | "JOB_APPROVED"
  | "JOB_REJECTED"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "JOB_CANCELLED"
  | "WORK_SUBMITTED"
  | "WORK_APPROVED"
  | "WORK_REVISION_REQUESTED"
  | "PAYMENT_RELEASED"
  | "JOB_COMPLETED"
  | "WORK_SUBMISSION_TIMEOUT"
  | "WORK_REVIEW_TIMEOUT"
  | "JOB_REOPENED"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESPONSE_REQUESTED"
  | "DISPUTE_RESPONSE_SUBMITTED"
  | "DISPUTE_RESOLVED_WIN"
  | "DISPUTE_RESOLVED_LOSE"
  | "CHAT_REQUEST_RECEIVED"
  | "CHAT_REQUEST_ACCEPTED"
  | "CHAT_REQUEST_REJECTED"
  | "CHAT_BLOCKED"
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
  WITHDRAWAL_REQUESTED: { icon: "exit_to_app", color: "text-orange-600" },
  WITHDRAWAL_APPROVED: { icon: "check_circle", color: "text-green-600" },
  WITHDRAWAL_REJECTED: { icon: "cancel", color: "text-red-600" },
  JOB_CANCELLED: { icon: "cancel", color: "text-red-600" },
  WORK_SUBMITTED: { icon: "upload_file", color: "text-purple-600" },
  WORK_APPROVED: { icon: "task_alt", color: "text-green-600" },
  WORK_REVISION_REQUESTED: { icon: "edit_note", color: "text-yellow-600" },
  PAYMENT_RELEASED: { icon: "payments", color: "text-emerald-600" },
  JOB_COMPLETED: { icon: "done_all", color: "text-green-600" },
  WORK_SUBMISSION_TIMEOUT: { icon: "timer_off", color: "text-red-600" },
  WORK_REVIEW_TIMEOUT: { icon: "schedule", color: "text-orange-600" },
  JOB_REOPENED: { icon: "refresh", color: "text-blue-600" },
  DISPUTE_CREATED: { icon: "report_problem", color: "text-red-600" },
  DISPUTE_RESPONSE_REQUESTED: { icon: "question_answer", color: "text-orange-600" },
  DISPUTE_RESPONSE_SUBMITTED: { icon: "reply", color: "text-blue-600" },
  DISPUTE_RESOLVED_WIN: { icon: "emoji_events", color: "text-green-600" },
  DISPUTE_RESOLVED_LOSE: { icon: "sentiment_dissatisfied", color: "text-red-600" },
  CHAT_REQUEST_RECEIVED: { icon: "person_add", color: "text-blue-600" },
  CHAT_REQUEST_ACCEPTED: { icon: "how_to_reg", color: "text-green-600" },
  CHAT_REQUEST_REJECTED: { icon: "person_remove", color: "text-red-600" },
  CHAT_BLOCKED: { icon: "block", color: "text-red-600" },
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
export type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED";

export const WORK_STATUS_CONFIG: Record<WorkStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", color: "text-gray-500" },
  IN_PROGRESS: { label: "Đang làm", color: "text-blue-600" },
  SUBMITTED: { label: "Đã nộp", color: "text-orange-600" },
  REVISION_REQUESTED: { label: "Yêu cầu chỉnh sửa", color: "text-yellow-600" },
  APPROVED: { label: "Đã duyệt", color: "text-green-600" },
};

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
    trustScore?: number;      // Điểm uy tín (UT)
    untrustScore?: number;    // Điểm không uy tín (KUT)
  };
  coverLetter?: string;
  status: ApplicationStatus;
  // Work submission fields
  workStatus?: WorkStatus;
  workStatusLabel?: string;
  workSubmissionUrl?: string;
  workSubmissionNote?: string;
  workSubmittedAt?: string;
  workRevisionNote?: string;
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

// Dispute types (TH3)
export type DisputeStatus = 
  | "PENDING_FREELANCER_RESPONSE" 
  | "PENDING_ADMIN_DECISION" 
  | "EMPLOYER_WON" 
  | "FREELANCER_WON" 
  | "CANCELLED";

export const DISPUTE_STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string }> = {
  PENDING_FREELANCER_RESPONSE: { label: "Chờ freelancer phản hồi", color: "text-orange-600" },
  PENDING_ADMIN_DECISION: { label: "Chờ admin quyết định", color: "text-blue-600" },
  EMPLOYER_WON: { label: "Employer thắng", color: "text-green-600" },
  FREELANCER_WON: { label: "Freelancer thắng", color: "text-green-600" },
  CANCELLED: { label: "Đã hủy", color: "text-gray-600" },
};

export interface DisputeFileAttachment {
  id: number;
  secureUrl: string;
  originalFilename?: string;
  readableSize?: string;
}

export interface DisputeUser {
  id: number;
  fullName: string;
  avatarUrl?: string;
}

export interface Dispute {
  id: number;
  jobId: number;
  jobTitle: string;
  employer: DisputeUser;
  employerEvidenceUrl: string;
  employerEvidenceFile?: DisputeFileAttachment;
  employerDescription: string;
  freelancer: DisputeUser;
  freelancerEvidenceUrl?: string;
  freelancerEvidenceFile?: DisputeFileAttachment;
  freelancerDescription?: string;
  freelancerDeadline?: string;
  status: DisputeStatus;
  statusLabel: string;
  adminNote?: string;
  resolvedBy?: DisputeUser;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== CHAT TYPES ====================

export type ChatMessageType = "TEXT" | "IMAGE" | "FILE" | "LIKE";
export type ChatMessageStatus = "SENT" | "DELIVERED" | "READ" | "FAILED";
export type ChatConversationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export interface ChatUserInfo {
  id: number;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  online?: boolean;
  lastActiveAt?: string;
}

export interface ChatUserSearchResult {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  canSendRequest: boolean;
  relationStatus?: "NONE" | "PENDING" | "ACCEPTED" | "BLOCKED" | "REJECTED";
  conversationId?: number;
  trustScore?: number;
  untrustScore?: number;
}

export interface ChatMessageFile {
  id: number;
  url: string;
  secureUrl: string;
  originalFilename: string;
  fileType: "IMAGE" | "DOCUMENT";
  mimeType: string;
  format: string;
  sizeBytes: number;
  readableSize: string;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  sender: ChatUserInfo;
  content: string;
  messageType: ChatMessageType;
  status: ChatMessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  replyTo?: {
    id: number;
    sender: ChatUserInfo;
    content: string;
    messageType?: string;
  };
  file?: ChatMessageFile;
}

export interface ChatConversation {
  id: number;
  otherUser: ChatUserInfo;
  status: ChatConversationStatus;
  blockedById?: number;
  lastMessage?: string;
  lastMessageType?: ChatMessageType;
  lastMessageDeleted?: boolean;
  lastMessageStatus?: ChatMessageStatus;
  lastMessageTime?: string;
  lastMessageSenderId?: number;
  unreadCount: number;
  firstMessage?: string;
  isInitiator: boolean;
  createdAt: string;
}
