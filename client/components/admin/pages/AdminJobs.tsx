"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Job, JobStatus, JOB_STATUS_CONFIG, Page } from "@/types/job";
import { Pagination } from "@/components/ui/pagination";
import AdminLoading from "../shared/AdminLoading";
import AdminPageHeader from "../shared/AdminPageHeader";
import AdminEmptyState from "../shared/AdminEmptyState";
import JobHistoryTimeline from "@/components/jobs/shared/JobHistoryTimeline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_OPTIONS: { value: JobStatus | "PENDING_APPROVAL"; label: string }[] = [
  { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { value: "OPEN", label: "Đã duyệt" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "REJECTED", label: "Bị từ chối" },
];

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<JobStatus>("PENDING_APPROVAL");
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyJobId, setHistoryJobId] = useState<number | null>(null);

  const fetchJobs = async (pageNum: number, status: JobStatus) => {
    setIsLoading(true);
    try {
      const response = status === "PENDING_APPROVAL"
        ? await api.adminGetPendingJobs({ page: pageNum, size: 10 })
        : await api.adminGetJobsByStatus(status, { page: pageNum, size: 10 });

      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<Job>;
        setJobs(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.adminCountPendingJobs();
      if (response.status === "SUCCESS") {
        setPendingCount(response.data);
      }
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

  useEffect(() => {
    fetchJobs(page, statusFilter);
    fetchPendingCount();
  }, [page, statusFilter]);

  const handleApprove = async (jobId: number) => {
    setProcessingJobId(jobId);
    try {
      const response = await api.adminApproveJob(jobId);
      if (response.status === "SUCCESS") {
        toast.success("Đã duyệt công việc thành công");
        fetchJobs(page, statusFilter);
        fetchPendingCount();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleReject = async (jobId: number) => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setProcessingJobId(jobId);
    try {
      const response = await api.adminRejectJob(jobId, rejectReason);
      if (response.status === "SUCCESS") {
        toast.success("Đã từ chối công việc và hoàn tiền cho người đăng");
        setRejectingJobId(null);
        setRejectReason("");
        fetchJobs(page, statusFilter);
        fetchPendingCount();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleHistoryClick = (jobId: number) => {
    setHistoryJobId(jobId);
    setHistoryDialogOpen(true);
  };

  const showHistoryButton = statusFilter === "IN_PROGRESS" || statusFilter === "COMPLETED";

  if (isLoading && jobs.length === 0) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader 
        title="Kiểm duyệt công việc" 
        totalElements={totalElements}
        badge={pendingCount > 0 ? { count: pendingCount, label: "chờ duyệt" } : undefined}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as JobStatus);
              setPage(0);
            }}
            className="h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00b14f]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {jobs.length === 0 ? (
        <AdminEmptyState message="Không có công việc nào" />
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">#{job.id} • {job.employer?.fullName || "Không có"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${JOB_STATUS_CONFIG[job.status]?.color || ""}`}>
                    {JOB_STATUS_CONFIG[job.status]?.label || job.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Ngân sách</p>
                    <p className="font-medium text-gray-900">{formatCurrency(job.budget)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Tạm giữ</p>
                    <p className="font-medium text-blue-600">{formatCurrency(job.escrowAmount)}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500">{formatDateTime(job.createdAt)}</p>

                {/* Rejection reason display */}
                {job.rejectionReason && statusFilter === "REJECTED" && (
                  <div className="bg-red-50 p-2 rounded text-sm text-red-700">
                    <strong>Lý do:</strong> <span className="line-clamp-3">{job.rejectionReason}</span>
                  </div>
                )}

                {/* Actions for pending */}
                {statusFilter === "PENDING_APPROVAL" && (
                  <div className="pt-2 border-t">
                    {rejectingJobId === job.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Nhập lý do từ chối..."
                          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex items-center justify-end gap-4 text-sm">
                          <button
                            onClick={() => {
                              setRejectingJobId(null);
                              setRejectReason("");
                            }}
                            className="text-gray-600 hover:text-gray-700 hover:underline"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleReject(job.id)}
                            disabled={processingJobId === job.id || !rejectReason.trim()}
                            className="text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                          >
                            {processingJobId === job.id ? "Đang xử lý..." : "Xác nhận từ chối"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-4 text-sm pt-2">
                        <button
                          onClick={() => setRejectingJobId(job.id)}
                          disabled={processingJobId === job.id}
                          className="text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApprove(job.id)}
                          disabled={processingJobId === job.id}
                          className="text-green-600 hover:text-green-700 hover:underline disabled:opacity-50"
                        >
                          {processingJobId === job.id ? "Đang xử lý..." : "Duyệt"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* History button for IN_PROGRESS/COMPLETED */}
                {showHistoryButton && (
                  <div className="pt-2 border-t flex justify-end">
                    <button
                      onClick={() => handleHistoryClick(job.id)}
                      className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                    >
                      Xem lịch sử
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Công việc</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người đăng</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ngân sách</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tạm giữ</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    {statusFilter === "PENDING_APPROVAL" && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    )}
                    {showHistoryButton && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Lịch sử</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <>
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{job.title}</p>
                          <p className="text-xs text-gray-500">#{job.id}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">{job.employer?.fullName || "Không có"}</p>
                          <p className="text-xs text-gray-500">{job.employer?.company || "-"}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(job.budget)}</td>
                        <td className="px-3 py-2 text-right font-medium text-blue-600">{formatCurrency(job.escrowAmount)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${JOB_STATUS_CONFIG[job.status]?.color || ""}`}>
                            {JOB_STATUS_CONFIG[job.status]?.label || job.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{formatDateTime(job.createdAt)}</td>
                        {statusFilter === "PENDING_APPROVAL" && (
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-3 text-sm">
                              <button
                                onClick={() => handleApprove(job.id)}
                                disabled={processingJobId === job.id}
                                className="text-green-600 hover:text-green-700 hover:underline disabled:opacity-50"
                              >
                                {processingJobId === job.id ? "..." : "Duyệt"}
                              </button>
                              <button
                                onClick={() => setRejectingJobId(rejectingJobId === job.id ? null : job.id)}
                                disabled={processingJobId === job.id}
                                className="text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        )}
                        {showHistoryButton && (
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleHistoryClick(job.id)}
                              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                            >
                              Xem
                            </button>
                          </td>
                        )}
                      </tr>
                      {/* Reject reason row */}
                      {rejectingJobId === job.id && (
                        <tr key={`reject-${job.id}`} className="bg-red-50">
                          <td colSpan={statusFilter === "PENDING_APPROVAL" ? 7 : 6} className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                className="flex-1 h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                              <button
                                onClick={() => handleReject(job.id)}
                                disabled={processingJobId === job.id || !rejectReason.trim()}
                                className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 whitespace-nowrap"
                              >
                                {processingJobId === job.id ? "Đang xử lý..." : "Xác nhận"}
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingJobId(null);
                                  setRejectReason("");
                                }}
                                className="text-sm text-gray-600 hover:text-gray-700 hover:underline whitespace-nowrap"
                              >
                                Hủy
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* Rejection reason display */}
                      {job.rejectionReason && statusFilter === "REJECTED" && (
                        <tr key={`reason-${job.id}`} className="bg-red-50">
                          <td colSpan={6} className="px-3 py-2 text-sm text-red-700">
                            <strong>Lý do:</strong> {job.rejectionReason}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg shadow md:rounded-none md:shadow-none">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch sử hoạt động</DialogTitle>
            <DialogDescription>
              Xem các hoạt động liên quan đến công việc này
            </DialogDescription>
          </DialogHeader>
          {historyJobId && (
            <JobHistoryTimeline jobId={historyJobId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
