"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Job, JOB_STATUS_CONFIG } from "@/types/job";

interface EmployerJobCardProps {
  job: Job;
  formatBudget: (job: Job) => string;
  formatDate: (date?: string) => string;
  onDelete: (job: Job) => void;
  onReviewWork: (job: Job) => void;
  onCreateDispute: (job: Job) => void;
  onViewDispute: (jobId: number) => void;
  onViewHistory: (jobId: number) => void;
  showHistoryButton: boolean;
}

export default function EmployerJobCard({
  job,
  formatBudget,
  formatDate,
  onDelete,
  onReviewWork,
  onCreateDispute,
  onViewDispute,
  onViewHistory,
  showHistoryButton,
}: EmployerJobCardProps) {
  const budgetLabel = formatBudget(job);
  const hasReviewDeadline = Boolean(job.workReviewDeadline);
  const hasSubmissionDeadline = Boolean(job.workSubmissionDeadline);
  const canEdit =
    job.status === "DRAFT" && job.applicationCount === 0;
  const canDelete =
    (job.status === "DRAFT" ||
      job.status === "PENDING_APPROVAL" ||
      job.status === "REJECTED") &&
    job.applicationCount === 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">#{job.id}</span>
            <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-[#00b14f]">
              {job.title}
            </Link>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                JOB_STATUS_CONFIG[job.status]?.color || "bg-gray-100 text-gray-700"
              }`}
            >
              {JOB_STATUS_CONFIG[job.status]?.label || job.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Icon name="payments" size={16} />
              {budgetLabel}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="people" size={16} />
              {job.applicationCount} ứng viên
            </span>
            <span className="flex items-center gap-1">
              <Icon name="visibility" size={16} />
              {job.viewCount} lượt xem
            </span>
            {job.applicationDeadline && (
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={16} />
                Hạn: {formatDate(job.applicationDeadline)}
              </span>
            )}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 5).map((skill) => (
                <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {skill}
                </span>
              ))}
              {job.skills.length > 5 && (
                <span className="px-2 py-0.5 text-gray-400 text-xs">+{job.skills.length - 5}</span>
              )}
            </div>
          )}

          {job.status === "DRAFT" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <Icon name="info" size={16} />
              <span>Thanh toán để công việc được hiển thị công khai</span>
            </div>
          )}

          {job.status === "IN_PROGRESS" && hasReviewDeadline && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <Icon name="timer" size={16} />
              <span>Hạn duyệt sản phẩm: {formatDate(job.workReviewDeadline)}</span>
            </div>
          )}
          {job.status === "IN_PROGRESS" && hasSubmissionDeadline && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <Icon name="upload_file" size={16} />
              <span>Chờ người làm nộp bài (hạn: {formatDate(job.workSubmissionDeadline)})</span>
            </div>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2">
          <Link href={`/jobs/${job.id}`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              <Icon name="visibility" size={16} />
              <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
            </Button>
          </Link>
          {showHistoryButton && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-gray-600 border-gray-200 hover:bg-gray-50"
              onClick={() => onViewHistory(job.id)}
            >
              <Icon name="history" size={16} />
              <span className="sm:hidden lg:inline ml-1">Lịch sử</span>
            </Button>
          )}
          {job.status === "IN_PROGRESS" && hasReviewDeadline && (
            <>
              <Button
                size="sm"
                className="flex-1 sm:flex-none bg-[#00b14f] hover:bg-[#009643]"
                onClick={() => onReviewWork(job)}
              >
                <Icon name="rate_review" size={16} />
                <span className="sm:hidden lg:inline ml-1">Duyệt sản phẩm</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-gray-600 border-gray-200 hover:bg-gray-50"
                onClick={() => onCreateDispute(job)}
              >
                <Icon name="report_problem" size={16} />
                <span className="sm:hidden lg:inline ml-1">Khiếu nại</span>
              </Button>
            </>
          )}
          {job.status === "DISPUTED" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-gray-600 border-gray-200 hover:bg-gray-50"
              onClick={() => onViewDispute(job.id)}
            >
              <Icon name="gavel" size={16} />
              <span className="sm:hidden lg:inline ml-1">Xem tranh chấp</span>
            </Button>
          )}
          {canEdit && (
            <Link href={`/jobs/${job.id}/edit`} className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[#00b14f] border-[#00b14f] hover:bg-[#00b14f]/5"
              >
                <Icon name="edit" size={16} />
                <span className="sm:hidden lg:inline ml-1">Sửa</span>
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-gray-600 border-gray-200 hover:bg-gray-50"
              onClick={() => onDelete(job)}
            >
              <Icon name="delete" size={16} />
              <span className="sm:hidden lg:inline ml-1">Xóa</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
