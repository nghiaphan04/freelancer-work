"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import JobsLoading from "@/components/jobs/shared/JobsLoading";
import JobsEmptyState from "@/components/jobs/shared/JobsEmptyState";

interface ApprovedJob {
  id: number;
  title: string;
  budget?: number;
  currency?: string;
  workSubmissionUrl?: string;
  workSubmissionDeadline?: string;
  workSubmittedAt?: string;
  employer?: {
    fullName: string;
  };
}

interface SubmittedTabProps {
  jobs: ApprovedJob[];
  isLoading: boolean;
}

export default function SubmittedTab({ jobs, isLoading }: SubmittedTabProps) {
  if (isLoading) {
    return <JobsLoading />;
  }

  const approvedJobs = jobs.filter((j: any) => j.workStatus === "APPROVED");

  if (approvedJobs.length === 0) {
    return (
      <JobsEmptyState 
        icon="check_circle" 
        message="Chưa có sản phẩm nào được nghiệm thu"
      />
    );
  }

  return (
    <div className="space-y-4">
      {approvedJobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">#{job.id}</span>
                <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-[#00b14f]">
                  {job.title}
                </Link>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
                  Hoàn thành
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Đúng tiến độ
                </span>
              </div>
              
              {job.employer && <p className="text-sm text-gray-600 mb-2">{job.employer.fullName}</p>}
              
              <p className="text-sm text-gray-600 mb-3">
                {job.budget} {job.currency}
              </p>

              {job.workSubmissionUrl && (
                <a
                  href={job.workSubmissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <Icon name="picture_as_pdf" size={18} className="text-gray-600" />
                  <span className="text-sm text-gray-700">Xem sản phẩm đã nghiệm thu</span>
                  <Icon name="open_in_new" size={16} className="text-gray-400 ml-auto" />
                </a>
              )}
            </div>

            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <Link href={`/jobs/${job.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Icon name="visibility" size={16} />
                  <span className="ml-1">Chi tiết</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
