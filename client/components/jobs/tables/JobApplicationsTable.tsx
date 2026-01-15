"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, JobApplication, ApplicationStatus } from "@/lib/api";
import { Job } from "@/types/job";
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

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-gray-100 text-gray-600" },
  ACCEPTED: { label: "Đã chấp nhận", color: "bg-gray-100 text-gray-600" },
  REJECTED: { label: "Đã từ chối", color: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Đã rút", color: "bg-gray-100 text-gray-600" },
};

const STATUS_OPTIONS: { value: ApplicationStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "ACCEPTED", label: "Đã chấp nhận" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "WITHDRAWN", label: "Đã rút" },
];

export default function JobApplicationsTable() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");

  // Action states
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null);

  // View dialogs
  const [showSkillsDialog, setShowSkillsDialog] = useState(false);
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, appsRes] = await Promise.all([
          api.getJobById(jobId),
          api.getJobApplications(jobId),
        ]);

        if (jobRes.status === "SUCCESS" && jobRes.data) {
          setJob(jobRes.data);
        } else {
          notFound();
          return;
        }

        if (appsRes.status === "SUCCESS" && appsRes.data) {
          setApplications(appsRes.data);
          setFilteredApplications(appsRes.data);
        }
      } catch {
        toast.error("Không thể tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  useEffect(() => {
    if (statusFilter) {
      setFilteredApplications(applications.filter((app) => app.status === statusFilter));
    } else {
      setFilteredApplications(applications);
    }
  }, [statusFilter, applications]);

  const handleAction = (app: JobApplication, action: "accept" | "reject") => {
    setSelectedApp(app);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const executeAction = async () => {
    if (!selectedApp || !confirmAction) return;

    setProcessingId(selectedApp.id);

    try {
      const res = confirmAction === "accept"
        ? await api.acceptApplication(jobId, selectedApp.id)
        : await api.rejectApplication(jobId, selectedApp.id);

      if (res.status === "SUCCESS") {
        toast.success(confirmAction === "accept" ? "Đã chấp nhận ứng viên" : "Đã từ chối ứng viên");
        setApplications((apps) =>
          apps.map((a) =>
            a.id === selectedApp.id
              ? { ...a, status: (confirmAction === "accept" ? "ACCEPTED" : "REJECTED") as ApplicationStatus }
              : a
          )
        );
        setShowConfirmDialog(false);
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setProcessingId(null);
      setSelectedApp(null);
      setConfirmAction(null);
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4"
        >
          <Icon name="arrow_back" size={20} />
          Quay lại chi tiết
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Danh sách ứng viên</h1>
        <p className="text-gray-500 mt-1">Công việc: {job?.title}</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
              className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00b14f]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500">
            Tổng: {filteredApplications.length} ứng viên
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="inbox" size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có ứng viên nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ứng viên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kỹ năng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thư giới thiệu</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày ứng tuyển</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={app.freelancer.avatarUrl} alt={app.freelancer.fullName} />
                          <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                            {app.freelancer.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{app.freelancer.fullName}</p>
                          {app.freelancer.phoneNumber && (
                            <p className="text-xs text-gray-500">{app.freelancer.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {app.freelancer.skills && app.freelancer.skills.length > 0 ? (
                        <button
                          onClick={() => { setViewingApp(app); setShowSkillsDialog(true); }}
                          className="text-[#00b14f] hover:underline text-sm text-left"
                        >
                          {app.freelancer.skills.length} kỹ năng
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {app.coverLetter ? (
                        <button
                          onClick={() => { setViewingApp(app); setShowCoverLetterDialog(true); }}
                          className="text-[#00b14f] hover:underline text-sm text-left line-clamp-1 max-w-[200px]"
                        >
                          Xem thư giới thiệu
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[app.status]?.color}`}>
                        {STATUS_CONFIG[app.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {app.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleAction(app, "accept")}
                            disabled={processingId === app.id}
                            className="text-[#00b14f] hover:underline text-sm disabled:opacity-50"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleAction(app, "reject")}
                            disabled={processingId === app.id}
                            className="text-red-600 hover:underline text-sm disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-center block">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => !processingId && setShowConfirmDialog(open)}>
        <DialogContent 
          onPointerDownOutside={(e) => processingId && e.preventDefault()} 
          onEscapeKeyDown={(e) => processingId && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "accept" ? "Chấp nhận ứng viên" : "Từ chối ứng viên"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "accept"
                ? `Bạn có chắc muốn chấp nhận "${selectedApp?.freelancer.fullName}" cho công việc này?`
                : `Bạn có chắc muốn từ chối "${selectedApp?.freelancer.fullName}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={!!processingId}>
              Hủy
            </Button>
            <Button
              onClick={executeAction}
              disabled={!!processingId}
              className={confirmAction === "accept" ? "bg-[#00b14f] hover:bg-[#009643]" : "bg-gray-600 hover:bg-gray-700"}
            >
              {processingId ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                confirmAction === "accept" ? "Chấp nhận" : "Từ chối"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills Dialog */}
      <Dialog open={showSkillsDialog} onOpenChange={setShowSkillsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kỹ năng của {viewingApp?.freelancer.fullName}</DialogTitle>
            <DialogDescription>
              Danh sách kỹ năng của ứng viên
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingApp?.freelancer.skills && viewingApp.freelancer.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {viewingApp.freelancer.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Chưa có kỹ năng nào</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkillsDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog */}
      <Dialog open={showCoverLetterDialog} onOpenChange={setShowCoverLetterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thư giới thiệu</DialogTitle>
            <DialogDescription>
              Từ {viewingApp?.freelancer.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingApp?.coverLetter ? (
              <p className="text-gray-700 whitespace-pre-wrap">{viewingApp.coverLetter}</p>
            ) : (
              <p className="text-gray-500">Không có thư giới thiệu</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoverLetterDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
