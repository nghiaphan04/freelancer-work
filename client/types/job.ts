// Enums matching backend
export type JobStatus = "DRAFT" | "OPEN" | "PENDING_SIGNATURE" | "IN_PROGRESS" | "DISPUTED" | "COMPLETED" | "CLOSED" | "CANCELLED" | "SIGNING_TIMEOUT" | "WORK_TIMEOUT" | "REVIEW_TIMEOUT" | "EXPIRED";
export type JobComplexity = "ENTRY" | "INTERMEDIATE" | "EXPERT";
export type JobDuration = "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
export type WorkType = "PART_TIME" | "FULL_TIME";
export type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED";

// Employer info in job response
export interface JobFreelancer {
  id: number;
  fullName: string;
  avatarUrl?: string;
  walletAddress?: string;
}

export interface JobEmployer {
  id: number;
  fullName: string;
  avatarUrl?: string;
  walletAddress?: string;
  title?: string;
  company?: string;
  location?: string;
  isVerified?: boolean;
  trustScore?: number;      // Điểm uy tín (UT)
  untrustScore?: number;    // Điểm không uy tín (KUT)
}

// Job response from backend
export interface Job {
  id: number;
  title: string;
  description: string;
  context?: string;
  requirements?: string;
  deliverables?: string;
  skills: string[];
  complexity: JobComplexity;
  duration: JobDuration;
  workType: WorkType;
  budget?: number;
  escrowAmount?: number;  // Số tiền đã giữ (budget + fee)
  currency: string;
  applicationDeadline?: string;
  submissionDays?: number;
  reviewDays?: number;
  status: JobStatus;
  workSubmissionDeadline?: string;  // Hạn nộp sản phẩm
  workReviewDeadline?: string;      // Hạn review sản phẩm
  viewCount: number;
  applicationCount: number;
  employer: JobEmployer;
  freelancer?: JobFreelancer;
  createdAt: string;
  updatedAt: string;
  workStatus?: WorkStatus;
  workSubmissionUrl?: string;
  workSubmissionNote?: string;
  workSubmittedAt?: string;
  escrowId?: number;
  walletAddress?: string;
  pendingBlockchainAction?: string;
  freelancerWalletAddress?: string;
  txHash?: string;
  paymentTxHash?: string;
  refundTxHash?: string;
  acceptedAt?: string;
  signDeadline?: string;
  contractSignedAt?: string;
  jobWorkSubmittedAt?: string;
  // Dispute info (for DISPUTED status)
  disputeInfo?: {
    id: number;
    status: string;
    evidenceDeadline?: string;
    hasFreelancerEvidence: boolean;
    currentRound?: number;
  };
}

// Request DTOs
export interface CreateJobRequest {
  title: string;
  description: string;
  context?: string;
  requirements?: string;
  deliverables?: string;
  skills?: string[];
  complexity?: JobComplexity;
  duration?: JobDuration;
  workType?: WorkType;
  budget?: number;
  currency?: string;
  applicationDeadline?: string;
  submissionDays?: number;
  reviewDays?: number;
  escrowId?: number;
  walletAddress?: string;
  txHash?: string;
  saveAsDraft?: boolean;
}

export interface ContractTerm {
  title: string;
  content: string;
}

export type TimeUnit = "minutes" | "days";

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  context?: string;
  requirements?: string;
  deliverables?: string;
  skills?: string[];
  complexity?: JobComplexity;
  duration?: JobDuration;
  workType?: WorkType;
  budget?: number;
  currency?: string;
  applicationDeadline?: string;
  applicationDeadlineValue?: number;
  applicationDeadlineUnit?: TimeUnit;
  submissionValue?: number;
  submissionUnit?: TimeUnit;
  submissionDays?: number;
  reviewValue?: number;
  reviewUnit?: TimeUnit;
  reviewDays?: number;
  terms?: ContractTerm[];
  txHash?: string;
  escrowId?: number;
  walletAddress?: string;
  status?: "DRAFT" | "OPEN";
  contractHash?: string;
}

// Paginated response
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// UI Config
export const JOB_STATUS_CONFIG = {
  DRAFT: { label: "Bản nháp", color: "bg-gray-100 text-gray-600" },
  OPEN: { label: "Đang tuyển", color: "bg-green-100 text-green-600" },
  PENDING_SIGNATURE: { label: "Chờ ký hợp đồng", color: "bg-green-100 text-green-600" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "bg-gray-100 text-gray-600" },
  DISPUTED: { label: "Đang tranh chấp", color: "bg-gray-200 text-gray-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-600" },
  CLOSED: { label: "Đã đóng", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
  SIGNING_TIMEOUT: { label: "Hết hạn ký", color: "bg-orange-100 text-orange-600" },
  WORK_TIMEOUT: { label: "Hết hạn nộp", color: "bg-orange-100 text-orange-600" },
  REVIEW_TIMEOUT: { label: "Hết hạn duyệt", color: "bg-orange-100 text-orange-600" },
  EXPIRED: { label: "Hết hạn ứng tuyển", color: "bg-orange-100 text-orange-600" },
} as const;

export const JOB_COMPLEXITY_CONFIG = {
  ENTRY: { label: "Người mới", color: "bg-gray-100 text-gray-600" },
  INTERMEDIATE: { label: "Trung bình", color: "bg-gray-100 text-gray-600" },
  EXPERT: { label: "Chuyên gia", color: "bg-gray-100 text-gray-600" },
} as const;

export const JOB_DURATION_CONFIG = {
  SHORT_TERM: { label: "Ngắn hạn", description: "Dưới 1 tháng" },
  MEDIUM_TERM: { label: "Trung hạn", description: "1-6 tháng" },
  LONG_TERM: { label: "Dài hạn", description: "Trên 6 tháng" },
} as const;

export const WORK_TYPE_CONFIG = {
  PART_TIME: { label: "Bán thời gian", description: "Dưới 30 giờ/tuần" },
  FULL_TIME: { label: "Toàn thời gian", description: "Trên 30 giờ/tuần" },
} as const;

// Job History
export type JobHistoryAction =
  | "JOB_CREATED"
  | "JOB_UPDATED"
  | "JOB_OPENED"
  | "JOB_CLOSED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "WORK_APPROVED"
  | "WORK_REJECTED"
  | "PAYMENT_RELEASED"
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_WITHDRAWN"
  | "WORK_STARTED"
  | "WORK_SUBMITTED"
  | "WORK_REVISED"
  | "JOB_COMPLETED"
  | "JOB_CANCELLED"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "WITHDRAWAL_CANCELLED"
  | "FREELANCER_TIMEOUT"
  | "EMPLOYER_TIMEOUT"
  | "JOB_REOPENED"
  | "AUTO_APPROVED"
  | "JOB_EXPIRED"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESPONSE_SUBMITTED"
  | "DISPUTE_RESOLVED";

export interface JobHistoryUser {
  id: number;
  fullName: string;
  avatarUrl?: string;
  walletAddress?: string;
  role: "ADMIN" | "EMPLOYER" | "FREELANCER" | "USER";
}

export interface JobHistory {
  id: number;
  jobId: number;
  action: JobHistoryAction;
  actionLabel: string;
  description?: string;
  metadata?: string;
  user: JobHistoryUser;
  createdAt: string;
  fileAttachment?: JobHistoryFileAttachment;
}

export interface JobHistoryFileAttachment {
  id: number;
  secureUrl: string;
  originalFilename?: string;
  readableSize?: string;
}

export const JOB_HISTORY_ACTION_CONFIG: Record<JobHistoryAction, { label: string; icon: string; color: string }> = {
  JOB_CREATED: { label: "Tạo công việc", icon: "add_circle", color: "text-blue-600" },
  JOB_UPDATED: { label: "Cập nhật", icon: "edit", color: "text-gray-600" },
  JOB_OPENED: { label: "Mở tuyển", icon: "visibility", color: "text-green-600" },
  JOB_CLOSED: { label: "Đóng tuyển", icon: "visibility_off", color: "text-gray-600" },
  APPLICATION_ACCEPTED: { label: "Duyệt ứng viên", icon: "check_circle", color: "text-green-600" },
  APPLICATION_REJECTED: { label: "Từ chối ứng viên", icon: "cancel", color: "text-red-600" },
  WORK_APPROVED: { label: "Duyệt công việc", icon: "task_alt", color: "text-green-600" },
  WORK_REJECTED: { label: "Yêu cầu chỉnh sửa", icon: "undo", color: "text-orange-600" },
  PAYMENT_RELEASED: { label: "Thanh toán", icon: "payments", color: "text-emerald-600" },
  APPLICATION_SUBMITTED: { label: "Nộp đơn", icon: "description", color: "text-blue-600" },
  APPLICATION_WITHDRAWN: { label: "Rút đơn", icon: "remove_circle", color: "text-gray-600" },
  WORK_STARTED: { label: "Bắt đầu làm", icon: "play_circle", color: "text-blue-600" },
  WORK_SUBMITTED: { label: "Nộp sản phẩm", icon: "upload_file", color: "text-purple-600" },
  WORK_REVISED: { label: "Nộp lại", icon: "refresh", color: "text-orange-600" },
  JOB_COMPLETED: { label: "Hoàn thành", icon: "done_all", color: "text-emerald-600" },
  JOB_CANCELLED: { label: "Đã hủy", icon: "cancel", color: "text-red-600" },
  WITHDRAWAL_REQUESTED: { label: "Yêu cầu rút/hủy", icon: "exit_to_app", color: "text-orange-600" },
  WITHDRAWAL_APPROVED: { label: "Chấp nhận yêu cầu", icon: "check_circle", color: "text-green-600" },
  WITHDRAWAL_REJECTED: { label: "Từ chối yêu cầu", icon: "cancel", color: "text-red-600" },
  WITHDRAWAL_CANCELLED: { label: "Hủy yêu cầu", icon: "undo", color: "text-gray-600" },
  FREELANCER_TIMEOUT: { label: "Freelancer quá hạn", icon: "timer_off", color: "text-red-600" },
  EMPLOYER_TIMEOUT: { label: "Employer quá hạn", icon: "schedule", color: "text-orange-600" },
  JOB_REOPENED: { label: "Mở lại công việc", icon: "refresh", color: "text-blue-600" },
  AUTO_APPROVED: { label: "Tự động duyệt", icon: "auto_awesome", color: "text-purple-600" },
  JOB_EXPIRED: { label: "Hết hạn ứng tuyển", icon: "schedule", color: "text-orange-600" },
  DISPUTE_CREATED: { label: "Tạo khiếu nại", icon: "report_problem", color: "text-red-600" },
  DISPUTE_RESPONSE_SUBMITTED: { label: "Phản hồi khiếu nại", icon: "reply", color: "text-blue-600" },
  DISPUTE_RESOLVED: { label: "Giải quyết tranh chấp", icon: "gavel", color: "text-purple-600" },
};
