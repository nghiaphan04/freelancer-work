// Enums matching backend
export type JobStatus = "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" | "CANCELLED";
export type JobComplexity = "ENTRY" | "INTERMEDIATE" | "EXPERT";
export type JobDuration = "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
export type WorkType = "PART_TIME" | "FULL_TIME";

// Employer info in job response
export interface JobEmployer {
  id: number;
  fullName: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  location?: string;
  isVerified?: boolean;
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
  currency: string;
  applicationDeadline?: string;
  expectedStartDate?: string;
  status: JobStatus;
  viewCount: number;
  applicationCount: number;
  employer: JobEmployer;
  createdAt: string;
  updatedAt: string;
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
  expectedStartDate?: string;
}

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
  expectedStartDate?: string;
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
  DRAFT: { label: "Bản nháp", color: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Đang tuyển", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Đã đóng", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
} as const;

export const JOB_COMPLEXITY_CONFIG = {
  ENTRY: { label: "Người mới", color: "bg-green-100 text-green-700" },
  INTERMEDIATE: { label: "Trung bình", color: "bg-yellow-100 text-yellow-700" },
  EXPERT: { label: "Chuyên gia", color: "bg-purple-100 text-purple-700" },
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
