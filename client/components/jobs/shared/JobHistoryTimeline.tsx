"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { JobHistory, JOB_HISTORY_ACTION_CONFIG } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface JobHistoryTimelineProps {
  jobId: number;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Quản trị viên", color: "bg-gray-100 text-gray-600" },
  EMPLOYER: { label: "Bên thuê", color: "bg-gray-100 text-gray-600" },
  FREELANCER: { label: "Người làm", color: "bg-gray-100 text-gray-600" },
  USER: { label: "Người dùng", color: "bg-gray-100 text-gray-600" },
};

export default function JobHistoryTimeline({ jobId }: JobHistoryTimelineProps) {
  const [history, setHistory] = useState<JobHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await api.getJobHistory(jobId);
        if (response.status === "SUCCESS" && response.data) {
          setHistory(response.data);
        } else {
          setError(response.message || "Không thể tải lịch sử");
        }
      } catch {
        setError("Đã có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 sm:gap-3">
            <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <Skeleton className="h-3 sm:h-4 w-1/3" />
              <Skeleton className="h-2.5 sm:h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8">
        <Icon name="error_outline" size={28} className="text-red-400 mx-auto mb-2 sm:hidden" />
        <Icon name="error_outline" size={32} className="text-red-400 mx-auto mb-2 hidden sm:block" />
        <p className="text-gray-600 text-xs sm:text-sm">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <Icon name="history" size={28} className="text-gray-300 mx-auto mb-2 sm:hidden" />
        <Icon name="history" size={32} className="text-gray-300 mx-auto mb-2 hidden sm:block" />
        <p className="text-gray-500 text-xs sm:text-sm">Chưa có lịch sử hoạt động</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line - responsive position */}
      <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {history.map((item, index) => {
        const config = JOB_HISTORY_ACTION_CONFIG[item.action];
        const roleConfig = ROLE_CONFIG[item.user.role] || ROLE_CONFIG.USER;
        const isLast = index === history.length - 1;

        const fileAttachment = item.fileAttachment;

        return (
          <div key={item.id} className={`relative pl-8 sm:pl-10 ${isLast ? "" : "pb-4 sm:pb-5"}`}>
            {/* Timeline dot - responsive position */}
            <div className={`absolute left-1 sm:left-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 flex items-center justify-center ${config.color.replace("text-", "border-")}`}>
              <Icon name={config.icon} size={12} className={config.color} />
            </div>

            {/* Content card */}
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              {/* Header: action + time */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-0.5 sm:gap-2 mb-1.5 sm:mb-1">
                <span className={`font-medium text-xs sm:text-sm ${config.color}`}>
                  {item.actionLabel}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              )}

              {fileAttachment && (
                <a
                  href={fileAttachment.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors mb-2"
                >
                  <Icon name="picture_as_pdf" size={18} className="text-red-500 shrink-0" />
                  <div className="flex-1 text-sm text-gray-700 truncate">
                    <span className="font-medium">{fileAttachment.originalFilename || "Tệp đã nộp"}</span>
                    {fileAttachment.readableSize && (
                      <span className="block text-xs text-gray-500">
                        {fileAttachment.readableSize}
                      </span>
                    )}
                  </div>
                  <Icon name="download" size={16} className="text-gray-500 shrink-0" />
                </a>
              )}

              {/* User info */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Avatar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0">
                  <AvatarImage src={item.user.avatarUrl} />
                  <AvatarFallback className="text-[8px] sm:text-[10px] bg-gray-200">
                    {item.user.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] sm:text-xs text-gray-600 truncate max-w-[120px] sm:max-w-none">
                  {item.user.fullName}
                </span>
                <Badge variant="secondary" className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 ${roleConfig.color}`}>
                  {roleConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
