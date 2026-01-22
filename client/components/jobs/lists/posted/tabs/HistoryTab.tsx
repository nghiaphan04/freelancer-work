"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import JobsEmptyState from "../../../shared/JobsEmptyState";
import JobHistoryTimeline from "../../../shared/JobHistoryTimeline";
import { JOB_STATUS_CONFIG, Job } from "@/types/job";

interface HistoryTabProps {
  jobs: Job[];
  formatBudget: (budget?: number, currency?: string) => string;
}

export default function HistoryTab({ jobs, formatBudget }: HistoryTabProps) {
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  
  const historyJobs = jobs.filter(j => j.status === "IN_PROGRESS" || j.status === "COMPLETED");

  if (historyJobs.length === 0) {
    return (
      <JobsEmptyState 
        icon="history" 
        message="Chưa có công việc nào có lịch sử hoạt động"
      />
    );
  }

  return (
    <div className="space-y-3">
      {historyJobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow overflow-hidden">
          {/* Job Header - Clickable */}
          <button
            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
            className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">#{job.id}</span>
                  <span className="font-semibold text-gray-900 truncate">{job.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color}`}>
                    {JOB_STATUS_CONFIG[job.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{formatBudget(job.budget, job.currency)}</p>
              </div>
              <Icon 
                name={expandedJobId === job.id ? "expand_less" : "expand_more"} 
                size={24} 
                className="text-gray-400 shrink-0"
              />
            </div>
          </button>

          {/* Expanded History */}
          {expandedJobId === job.id && (
            <div className="border-t bg-gray-50 p-4 sm:p-5">
              <JobHistoryTimeline jobId={job.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
