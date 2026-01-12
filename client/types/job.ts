export type JobStatus = "open" | "in_progress" | "pending_review" | "completed" | "cancelled";

export interface Job {
  id: number;
  title: string;
  description?: string;
  budget: string;
  status: JobStatus;
  createdAt: string;
  deadline: string;
  applicants?: number;
  freelancer?: { id: number; name: string; avatar?: string };
  employer?: { id: number; name: string; avatar?: string };
  startDate?: string;
  progress?: number;
  rating?: number;
}

export interface PostedJobsStats {
  open: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface AcceptedJobsStats {
  inProgress: number;
  pendingReview: number;
  completed: number;
  totalEarnings: number;
}

export const JOB_STATUS_CONFIG = {
  open: { label: "Đang mở", color: "bg-green-100 text-green-700" },
  in_progress: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-700" },
  pending_review: { label: "Chờ nghiệm thu", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
} as const;
