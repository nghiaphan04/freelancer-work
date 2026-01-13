"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, JobApplication, ApplicationStatus } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobApplicationsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "Đã chấp nhận", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Đã từ chối", color: "bg-red-100 text-red-700" },
  WITHDRAWN: { label: "Đã rút", color: "bg-gray-100 text-gray-600" },
};

export default function JobApplicationsList({
  open,
  onOpenChange,
  jobId,
  jobTitle,
}: JobApplicationsListProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchApplications();
    }
  }, [open, jobId]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getJobApplications(jobId);
      if (res.status === "SUCCESS" && res.data) {
        setApplications(res.data);
      }
    } catch {
      toast.error("Không thể tải danh sách ứng viên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (applicationId: number) => {
    setProcessingId(applicationId);
    try {
      const res = await api.acceptApplication(jobId, applicationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã chấp nhận ứng viên");
        setApplications(apps => 
          apps.map(a => a.id === applicationId ? { ...a, status: "ACCEPTED" as ApplicationStatus } : a)
        );
      } else {
        toast.error(res.message || "Không thể chấp nhận");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    setProcessingId(applicationId);
    try {
      const res = await api.rejectApplication(jobId, applicationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã từ chối ứng viên");
        setApplications(apps => 
          apps.map(a => a.id === applicationId ? { ...a, status: "REJECTED" as ApplicationStatus } : a)
        );
      } else {
        toast.error(res.message || "Không thể từ chối");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Danh sách ứng viên</DialogTitle>
          <DialogDescription>
            Công việc: {jobTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-500">Đang tải...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="inbox" size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có ứng viên nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={app.freelancer.avatarUrl} alt={app.freelancer.fullName} />
                      <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                        {app.freelancer.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{app.freelancer.fullName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[app.status]?.color}`}>
                          {STATUS_CONFIG[app.status]?.label}
                        </span>
                      </div>
                      {app.freelancer.skills && app.freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {app.freelancer.skills.slice(0, 5).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {app.freelancer.skills.length > 5 && (
                            <span className="text-xs text-gray-400">+{app.freelancer.skills.length - 5}</span>
                          )}
                        </div>
                      )}
                      {app.coverLetter && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{app.coverLetter}</p>
                      )}
                      <p className="text-xs text-gray-400">Ứng tuyển: {formatDate(app.createdAt)}</p>
                    </div>
                  </div>

                  {/* Actions for PENDING applications */}
                  {app.status === "PENDING" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(app.id)}
                        disabled={processingId === app.id}
                        className="bg-[#00b14f] hover:bg-[#009643]"
                      >
                        {processingId === app.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon name="check" size={16} />
                        )}
                        Chấp nhận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(app.id)}
                        disabled={processingId === app.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {processingId === app.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon name="close" size={16} />
                        )}
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
