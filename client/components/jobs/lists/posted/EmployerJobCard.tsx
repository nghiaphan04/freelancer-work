"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Job, JOB_STATUS_CONFIG } from "@/types/job";

interface EmployerJobCardProps {
  job: Job;
  formatBudget: (job: Job) => string;
  formatDate: (date?: string) => string;
  onDelete: (job: Job) => void;
  onToDraft: (job: Job) => void;
  isToDraftLoading?: boolean;
  onToOpen: (job: Job) => void;
  isToOpenLoading?: boolean;
  onPayment: (job: Job) => void;
  isPaymentLoading?: boolean;
  onRepost: (job: Job) => void;
  onReviewWork: (job: Job) => void;
  onCreateDispute: (job: Job) => void;
  onViewDispute: (jobId: number) => void;
  onViewHistory: (jobId: number) => void;
  showHistoryButton: boolean;
  onCancelBeforeSign?: (job: Job) => void;
  isCancelBeforeSignLoading?: boolean;
}

export default function EmployerJobCard({
  job,
  formatBudget,
  formatDate,
  onDelete,
  onToDraft,
  isToDraftLoading,
  onToOpen,
  isToOpenLoading,
  onPayment,
  isPaymentLoading,
  onRepost,
  onReviewWork,
  onCreateDispute,
  onViewDispute,
  onViewHistory,
  showHistoryButton,
  onCancelBeforeSign,
  isCancelBeforeSignLoading,
}: EmployerJobCardProps) {
  const [countdown, setCountdown] = useState<string>("");
  const [submissionCountdown, setSubmissionCountdown] = useState<string>("");
  const [reviewCountdown, setReviewCountdown] = useState<string>("");
  
  const budgetLabel = formatBudget(job);
  const hasReviewDeadline = Boolean(job.workReviewDeadline);
  const hasSubmissionDeadline = Boolean(job.workSubmissionDeadline);
  const canEdit = job.status === "DRAFT";
  const canDelete = job.status === "DRAFT";
  const isLoading = isToDraftLoading || isToOpenLoading || isPaymentLoading || isCancelBeforeSignLoading;
  const isPendingSignature = job.status === "PENDING_SIGNATURE";
  const isInProgress = job.status === "IN_PROGRESS";

  // Helper function to format countdown
  const formatCountdown = (diff: number): string => {
    if (diff <= 0) return "Đã hết hạn";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Countdown timer for signing deadline
  useEffect(() => {
    if (!isPendingSignature || !job.signDeadline) return;

    const updateCountdown = () => {
      const deadline = new Date(job.signDeadline!).getTime();
      const diff = deadline - Date.now();
      setCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isPendingSignature, job.signDeadline]);

  // Countdown timer for submission deadline
  useEffect(() => {
    if (!isInProgress || !job.workSubmissionDeadline || hasReviewDeadline) {
      setSubmissionCountdown("");
      return;
    }

    const updateCountdown = () => {
      const deadline = new Date(job.workSubmissionDeadline!).getTime();
      const diff = deadline - Date.now();
      setSubmissionCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isInProgress, job.workSubmissionDeadline, hasReviewDeadline]);

  // Countdown timer for review deadline
  useEffect(() => {
    if (!isInProgress || !job.workReviewDeadline) {
      setReviewCountdown("");
      return;
    }

    const updateCountdown = () => {
      const deadline = new Date(job.workReviewDeadline!).getTime();
      const diff = deadline - Date.now();
      setReviewCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isInProgress, job.workReviewDeadline]);

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
            <Link href={`/jobs/${job.id}/applications`} className="flex items-center gap-1 hover:text-[#00b14f]">
              <Icon name="people" size={16} />
              {job.applicationCount} người ứng tuyển
            </Link>
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

          {/* Status-specific guidance */}
          <div className="mt-3 space-y-2">
            {job.status === "DRAFT" && !job.escrowId && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <Icon name="info" size={16} />
                <span>Thanh toán để công việc được hiển thị công khai</span>
              </div>
            )}

            {job.status === "DRAFT" && job.escrowId && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                <Icon name="visibility_off" size={16} />
                <span>Công việc đang ẩn → Bấm "Công khai" để hiện lại</span>
              </div>
            )}

            {job.status === "OPEN" && job.applicationCount > 0 && (
              <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p>Có người ứng tuyển → Vào danh sách để chấp nhận hoặc từ chối</p>
                  <p className="text-gray-500 text-xs mt-1">Từ chối tất cả người ứng tuyển để có thể chuyển về Nháp hoặc hủy</p>
                </div>
              </div>
            )}

            {job.status === "PENDING_SIGNATURE" && (
              <div className="bg-green-50 px-3 py-2 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <Icon name="draw" size={16} />
                    <span>Đang chờ người làm ký hợp đồng</span>
                  </div>
                  {countdown && (
                    <span className={`font-medium ${countdown === "Đã hết hạn" ? "text-gray-700" : "text-green-600"}`}>
                      {countdown === "Đã hết hạn" ? countdown : `Còn ${countdown}`}
                    </span>
                  )}
                </div>
                {onCancelBeforeSign && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCancelBeforeSign(job)}
                      disabled={isCancelBeforeSignLoading}
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      {isCancelBeforeSignLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                          Đang hủy...
                        </>
                      ) : (
                        <>
                          <Icon name="cancel" size={16} />
                          Hủy công việc
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">Bạn có thể hủy và nhận lại 60% tiền (phí phạt 40%)</p>
                  </div>
                )}
              </div>
            )}

            {job.status === "IN_PROGRESS" && hasSubmissionDeadline && !hasReviewDeadline && (
              <div className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="upload_file" size={16} />
                  <span>Chờ người làm nộp bài (hạn: {formatDate(job.workSubmissionDeadline)})</span>
                </div>
                {submissionCountdown && (
                  <span className={`font-medium ${submissionCountdown === "Đã hết hạn" ? "text-gray-700" : "text-green-600"}`}>
                    {submissionCountdown === "Đã hết hạn" ? submissionCountdown : `Còn ${submissionCountdown}`}
                  </span>
                )}
              </div>
            )}

            {job.status === "IN_PROGRESS" && hasReviewDeadline && (
              <div className="flex items-center justify-between text-sm bg-green-50 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Icon name="rate_review" size={16} />
                  <span>Người làm đã nộp bài → Duyệt sản phẩm</span>
                </div>
                {reviewCountdown && (
                  <span className={`font-medium ${reviewCountdown === "Đã hết hạn" ? "text-gray-700" : "text-green-600"}`}>
                    {reviewCountdown === "Đã hết hạn" ? "Quá hạn!" : `Còn ${reviewCountdown}`}
                  </span>
                )}
              </div>
            )}

            {job.status === "DISPUTED" && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                <Icon name="gavel" size={16} />
                <span>Đang có tranh chấp → Chờ trọng tài viên xử lý</span>
              </div>
            )}

            {job.status === "EXPIRED" && (
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                <Icon name="schedule" size={16} />
                <span>Hết hạn ứng tuyển → Tiền ký quỹ đã được hoàn trả. Bạn có thể đăng lại công việc.</span>
              </div>
            )}

          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-2">
          <Link href={`/jobs/${job.id}`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full" disabled={isLoading}>
              <Icon name="visibility" size={16} />
              <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
            </Button>
          </Link>
          {job.applicationCount > 0 && (job.status === "OPEN" || job.status === "DRAFT") && (
            <Link href={`/jobs/${job.id}/applications`} className="flex-1 sm:flex-none">
              <Button size="sm" className="w-full bg-[#00b14f] hover:bg-[#009643]" disabled={isLoading}>
                <Icon name="people" size={16} />
                <span className="sm:hidden lg:inline ml-1">Xem người ứng tuyển</span>
              </Button>
            </Link>
          )}
          {showHistoryButton && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-gray-600 border-gray-200 hover:bg-gray-50"
              onClick={() => onViewHistory(job.id)}
              disabled={isLoading}
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
                disabled={isLoading}
              >
                <Icon name="rate_review" size={16} />
                <span className="sm:hidden lg:inline ml-1">Duyệt sản phẩm</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-gray-600 border-gray-200 hover:bg-gray-50"
                onClick={() => onCreateDispute(job)}
                disabled={isLoading}
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
              disabled={isLoading}
            >
              <Icon name="gavel" size={16} />
              <span className="sm:hidden lg:inline ml-1">Xem tranh chấp</span>
            </Button>
          )}
          {canEdit && !isLoading && (
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
          {job.status === "OPEN" && job.applicationCount === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-gray-600 border-gray-300 hover:bg-gray-50"
              onClick={() => onToDraft(job)}
              disabled={isLoading}
            >
              {isToDraftLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  <span className="sm:hidden lg:inline ml-1">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Icon name="edit_off" size={16} />
                  <span className="sm:hidden lg:inline ml-1">Về Nháp</span>
                </>
              )}
            </Button>
          )}
          {job.status === "DRAFT" && job.escrowId && (
            <Button
              size="sm"
              className="flex-1 sm:flex-none bg-[#00b14f] hover:bg-[#009643]"
              onClick={() => onToOpen(job)}
              disabled={isLoading}
            >
              {isToOpenLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="sm:hidden lg:inline ml-1">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Icon name="visibility" size={16} />
                  <span className="sm:hidden lg:inline ml-1">Công khai</span>
                </>
              )}
            </Button>
          )}
          {job.status === "DRAFT" && !job.escrowId && (
            <Button
              size="sm"
              className="flex-1 sm:flex-none bg-[#00b14f] hover:bg-[#009643]"
              onClick={() => onPayment(job)}
              disabled={isLoading}
            >
              {isPaymentLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="sm:hidden lg:inline ml-1">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Icon name="payment" size={16} />
                  <span className="sm:hidden lg:inline ml-1">Thanh toán & Công khai</span>
                </>
              )}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-gray-600 border-gray-300 hover:bg-gray-100"
              onClick={() => onDelete(job)}
              disabled={isLoading}
            >
              <Icon name="cancel" size={16} />
              <span className="sm:hidden lg:inline ml-1">Hủy</span>
            </Button>
          )}
          {job.status === "CANCELLED" && (
            <Button
              size="sm"
              className="flex-1 sm:flex-none bg-[#00b14f] hover:bg-[#009643]"
              onClick={() => onRepost(job)}
              disabled={isLoading}
            >
              <Icon name="refresh" size={16} />
              <span className="sm:hidden lg:inline ml-1">Đăng lại</span>
            </Button>
          )}
          {job.status === "EXPIRED" && (
            <Button
              size="sm"
              className="flex-1 sm:flex-none bg-[#00b14f] hover:bg-[#009643]"
              onClick={() => onRepost(job)}
              disabled={isLoading}
            >
              <Icon name="refresh" size={16} />
              <span className="sm:hidden lg:inline ml-1">Đăng lại</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
