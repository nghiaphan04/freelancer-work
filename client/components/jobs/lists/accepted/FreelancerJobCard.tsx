"use client";

import Link from "next/link";
import { Job, JOB_STATUS_CONFIG, WorkStatus } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const WORK_STATUS_CONFIG: Record<WorkStatus, { label: string; color: string; icon: string }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", color: "bg-gray-100 text-gray-600", icon: "hourglass_empty" },
  IN_PROGRESS: { label: "Đang làm", color: "bg-gray-100 text-gray-600", icon: "pending" },
  SUBMITTED: { label: "Đã nộp - Chờ duyệt", color: "bg-gray-100 text-gray-600", icon: "upload_file" },
  REVISION_REQUESTED: { label: "Cần chỉnh sửa", color: "bg-gray-100 text-gray-600", icon: "edit_note" },
  APPROVED: { label: "Đã duyệt", color: "bg-gray-100 text-gray-600", icon: "check_circle" },
};

interface FreelancerJobCardProps {
  job: Job;
  onSubmitWork: (job: { id: number; title: string }) => void;
  onViewDispute: (jobId: number) => void;
}

export default function FreelancerJobCard({ job, onSubmitWork, onViewDispute }: FreelancerJobCardProps) {
  const hasSubmittedWork = job.workStatus === "SUBMITTED" || Boolean(job.workSubmissionUrl);
  const isApprovedWork = job.workStatus === "APPROVED";
  const effectiveWorkStatus = job.workStatus || (hasSubmittedWork ? "SUBMITTED" : undefined);
  const workConfig = effectiveWorkStatus ? WORK_STATUS_CONFIG[effectiveWorkStatus] : undefined;

  const displayBudget = job.budget ? `${job.budget.toLocaleString("vi-VN")} ${job.currency}` : "Thương lượng";

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {job.employer && (
          <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
            <AvatarImage src={job.employer.avatarUrl} alt={job.employer.fullName} />
            <AvatarFallback className="bg-[#00b14f] text-white">
              {job.employer.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer truncate">
              {job.title}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                JOB_STATUS_CONFIG[job.status]?.color || "bg-gray-100 text-gray-700"
              }`}
            >
              {JOB_STATUS_CONFIG[job.status]?.label || job.status}
            </span>
          </div>

          {job.employer && <p className="text-sm text-gray-600 mb-2">{job.employer.fullName}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Icon name="payments" size={16} />
              {displayBudget}
            </span>
            {job.applicationDeadline && (
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={16} />
                Hạn: {new Date(job.applicationDeadline).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          {job.status === "IN_PROGRESS" && workConfig && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm mb-2 ${
                workConfig.color || "bg-gray-100 text-gray-600"
              }`}
            >
              <Icon name={workConfig.icon || "info"} size={16} />
              <span className="font-medium">{workConfig.label}</span>
            </div>
          )}

          {job.status === "IN_PROGRESS" && job.workSubmissionDeadline && effectiveWorkStatus !== "SUBMITTED" && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg mb-2">
              <Icon name="timer" size={16} />
              <span>Hạn nộp sản phẩm: {new Date(job.workSubmissionDeadline).toLocaleDateString("vi-VN")}</span>
            </div>
          )}

          {job.status === "IN_PROGRESS" && job.workReviewDeadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg mb-2">
              <Icon name="hourglass_top" size={16} />
              <span>
                Đang chờ bên thuê duyệt (hạn: {new Date(job.workReviewDeadline).toLocaleDateString("vi-VN")})
              </span>
            </div>
          )}

          {job.workSubmissionUrl && (
            <a
              href={job.workSubmissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors mb-2"
            >
              <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
              <span className="flex-1 text-sm text-gray-700 truncate">Sản phẩm đã nộp</span>
              <Icon name="download" size={18} className="text-gray-500 shrink-0" />
            </a>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          <Link href={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <Icon name="visibility" size={16} />
              <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
            </Button>
          </Link>
          {job.status === "IN_PROGRESS" && !isApprovedWork && (
            hasSubmittedWork ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <Icon name="hourglass_top" size={16} />
                <span className="sm:hidden lg:inline ml-1">Chờ duyệt</span>
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[#00b14f] hover:bg-[#009643]"
                onClick={() => onSubmitWork({ id: job.id, title: job.title })}
              >
                <Icon name="upload" size={16} />
                <span className="sm:hidden lg:inline ml-1">
                  {job.workStatus === "REVISION_REQUESTED" ? "Nộp lại" : "Nộp bài"}
                </span>
              </Button>
            )
          )}
          {job.status === "DISPUTED" && (
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
              onClick={() => onViewDispute(job.id)}
            >
              <Icon name="gavel" size={16} />
              <span className="sm:hidden lg:inline ml-1">Tranh chấp</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
