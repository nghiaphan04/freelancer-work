"use client";

import Link from "next/link";
import { Job, JOB_STATUS_CONFIG, JOB_COMPLEXITY_CONFIG, JOB_DURATION_CONFIG, WORK_TYPE_CONFIG } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

interface JobDetailHeaderProps {
  job: Job;
  isOwner: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatRelativeTime: (dateString: string) => string;
}

export default function JobDetailHeader({ job, isOwner, formatCurrency, formatRelativeTime }: JobDetailHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color}`}>
              {JOB_STATUS_CONFIG[job.status]?.label}
            </span>
            <span className="text-gray-400 text-sm">#{job.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Icon name="visibility" size={16} />
              {job.viewCount} lượt xem
            </span>
            <span className="flex items-center gap-1">
              <Icon name="group" size={16} />
              {job.applicationCount} ứng viên
            </span>
            <span className="flex items-center gap-1">
              <Icon name="schedule" size={16} />
              {formatRelativeTime(job.createdAt)}
            </span>
          </div>
        </div>
        {isOwner && job.status === "DRAFT" && job.applicationCount === 0 && (
          <Link href={`/jobs/${job.id}/edit`}>
            <Button variant="outline" size="sm">
              <Icon name="edit" size={16} />
              Sửa
            </Button>
          </Link>
        )}
      </div>

      {job.budget && (
        <div className="bg-[#00b14f]/5 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500 mb-1">Ngân sách</p>
          <p className="text-2xl font-bold text-[#00b14f]">
            {formatCurrency(job.budget, job.currency)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
          {JOB_COMPLEXITY_CONFIG[job.complexity]?.label}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
          {JOB_DURATION_CONFIG[job.duration]?.label}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
          {WORK_TYPE_CONFIG[job.workType]?.label}
        </span>
      </div>
    </div>
  );
}
