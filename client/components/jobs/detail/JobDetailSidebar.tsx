"use client";

import Link from "next/link";
import { Job, JOB_DURATION_CONFIG } from "@/types/job";
import { JobApplication } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const APPLICATION_STATUS_CONFIG = {
  PENDING: { label: "Đang chờ duyệt", color: "text-gray-600" },
  ACCEPTED: { label: "Đã được chấp nhận", color: "text-gray-600" },
  REJECTED: { label: "Đã bị từ chối", color: "text-gray-600" },
  WITHDRAWN: { label: "Đã rút đơn", color: "text-gray-600" },
};

interface JobDetailSidebarProps {
  job: Job;
  isOwner: boolean;
  isToggling: boolean;
  hasApplied: boolean;
  myApplication: JobApplication | null;
  onApply: () => void;
  onToggleStatus: () => void;
  formatDate: (dateString: string) => string;
}

export default function JobDetailSidebar({
  job,
  isOwner,
  isToggling,
  hasApplied,
  myApplication,
  onApply,
  onToggleStatus,
  formatDate,
}: JobDetailSidebarProps) {
  return (
    <div className="space-y-3">
      {/* Employer Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bên thuê</h2>
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={job.employer.avatarUrl} alt={job.employer.fullName} />
            <AvatarFallback className="bg-[#00b14f] text-white">
              {job.employer.fullName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              {job.employer.fullName}
              {job.employer.isVerified && (
                <Icon name="verified" size={16} className="text-[#00b14f]" />
              )}
            </p>
            {job.employer.title && (
              <p className="text-sm text-gray-500">{job.employer.title}</p>
            )}
            {/* Trust Score */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">
                UT: {job.employer.trustScore ?? 0}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded">
                KUT: {job.employer.untrustScore ?? 0}
              </span>
            </div>
          </div>
        </div>
        {job.employer.company && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Icon name="business" size={16} className="text-gray-400" />
            {job.employer.company}
          </div>
        )}
        {job.employer.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon name="location_on" size={16} className="text-gray-400" />
            {job.employer.location}
          </div>
        )}
      </div>

      {/* Timeline Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thời gian</h2>
        <div className="space-y-3">
          {job.applicationDeadline && (
            <div className="flex items-start gap-3">
              <Icon name="event" size={20} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Hạn nộp hồ sơ</p>
                <p className="font-medium text-gray-900">{formatDate(job.applicationDeadline)}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Icon name="hourglass_empty" size={20} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Thời hạn dự án</p>
              <p className="font-medium text-gray-900">
                {JOB_DURATION_CONFIG[job.duration]?.label} ({JOB_DURATION_CONFIG[job.duration]?.description})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline Card - TH2: Work Submission/Review Deadlines */}
      {(job.status === "IN_PROGRESS" || job.status === "DISPUTED") && (job.workSubmissionDeadline || job.workReviewDeadline) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="timer" size={20} />
            Hạn chót quan trọng
          </h2>
          <div className="space-y-3">
            {job.workSubmissionDeadline && (
              <div className="flex items-start gap-3">
                <Icon name="upload_file" size={20} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Hạn nộp sản phẩm</p>
                  <p className="font-medium text-gray-800">{formatDate(job.workSubmissionDeadline)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Quá hạn sẽ bị hủy và công việc mở lại
                  </p>
                </div>
              </div>
            )}
            {job.workReviewDeadline && (
              <div className="flex items-start gap-3">
                <Icon name="rate_review" size={20} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Hạn duyệt sản phẩm</p>
                  <p className="font-medium text-gray-800">{formatDate(job.workReviewDeadline)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Quá hạn sẽ tự động duyệt và thanh toán
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Button - For non-owners */}
      {!isOwner && job.status === "OPEN" && (
        hasApplied && myApplication ? (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="check_circle" size={20} className="text-[#00b14f]" />
              <span className="font-medium text-gray-900">Đã ứng tuyển</span>
            </div>
            <p className={`text-sm ${APPLICATION_STATUS_CONFIG[myApplication.status]?.color}`}>
              {APPLICATION_STATUS_CONFIG[myApplication.status]?.label}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Ngày gửi: {formatDate(myApplication.createdAt)}
            </p>
          </div>
        ) : (
          <Button
            onClick={onApply}
            className="w-full bg-[#00b14f] hover:bg-[#009643] text-white py-3"
          >
            <Icon name="send" size={20} />
            Ứng tuyển ngay
          </Button>
        )
      )}

      {/* Owner Actions */}
      {isOwner && (
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          {/* View Applications Button */}
          <Link href={`/jobs/${job.id}/applications`}>
            <Button variant="outline" className="w-full">
              <Icon name="group" size={20} />
              Xem ứng viên ({job.applicationCount})
            </Button>
          </Link>

          {/* Toggle Status */}
          {(job.status === "DRAFT" || job.status === "OPEN") && (
            <>
              <p className="text-sm text-gray-600">
                {job.status === "DRAFT"
                  ? "Công việc đang ẩn. Chuyển sang công khai để nhận ứng viên."
                  : job.applicationCount > 0
                    ? "Không thể chuyển về nháp khi đã có người ứng tuyển."
                    : "Công việc đang công khai. Chuyển sang nháp để tạm ẩn."}
              </p>
              <Button
                onClick={onToggleStatus}
                disabled={isToggling || (job.status === "OPEN" && job.applicationCount > 0)}
                className={`w-full ${
                  job.status === "DRAFT"
                    ? "bg-[#00b14f] hover:bg-[#009643]"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white`}
              >
                {isToggling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name={job.status === "DRAFT" ? "visibility" : "visibility_off"} size={20} />
                )}
                {job.status === "DRAFT" ? "Đăng công khai" : "Chuyển về nháp"}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Mã công việc</span>
            <span className="font-medium text-gray-900">#{job.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày đăng</span>
            <span className="font-medium text-gray-900">{formatDate(job.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cập nhật</span>
            <span className="font-medium text-gray-900">{formatDate(job.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
