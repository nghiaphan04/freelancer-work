"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, JobApplication, ApplicationStatus } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { Job } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WalletAvatar from "@/components/ui/WalletAvatar";
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
  ACCEPTED: { label: "Đã chấp nhận", color: "bg-green-100 text-green-600" },
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
  const { isConnected, connect, isConnecting, ganNguoiLam } = useWallet();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null);

  const [showSkillsDialog, setShowSkillsDialog] = useState(false);
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showBatchRejectDialog, setShowBatchRejectDialog] = useState(false);

  const pendingApplications = filteredApplications.filter(app => app.status === "PENDING");
  const selectedPendingIds = [...selectedIds].filter(id => 
    pendingApplications.some(app => app.id === id)
  );

  const toggleSelectAll = () => {
    if (selectedPendingIds.length === pendingApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingApplications.map(app => app.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchReject = async () => {
    if (selectedPendingIds.length === 0) return;

    setIsBatchProcessing(true);
    try {
      const res = await api.batchRejectApplications(jobId, selectedPendingIds);
      
      if (res.status === "SUCCESS" && res.data) {
        const { successCount, failCount } = res.data;
        
        // Update local state
        if (successCount > 0) {
          setApplications(apps =>
            apps.map(a =>
              selectedPendingIds.includes(a.id)
                ? { ...a, status: "REJECTED" as ApplicationStatus }
                : a
            )
          );
          toast.success(`Đã từ chối ${successCount} người làm`);
        }
        
        if (failCount > 0) {
          toast.error(`${failCount} người làm không thể từ chối`);
        }
      } else {
        toast.error(res.message || "Không thể thực hiện thao tác");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setSelectedIds(new Set());
      setShowBatchRejectDialog(false);
      setIsBatchProcessing(false);
    }
  };

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

  const handleAction = async (app: JobApplication, action: "accept" | "reject") => {
    if (action === "accept" && !isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để chấp nhận người làm");
        return;
      }
    }
    
    setSelectedApp(app);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const executeAction = async () => {
    if (!selectedApp || !confirmAction) return;

    setProcessingId(selectedApp.id);

    try {
      if (confirmAction === "accept") {
        if (!isConnected) {
          toast.error("Vui lòng kết nối ví");
          return;
        }

        if (!selectedApp.walletAddress) {
          toast.error("Người làm chưa cung cấp địa chỉ ví");
          return;
        }

        if (!job?.escrowId) {
          toast.error("Không thể thực hiện thao tác");
          return;
        }

        const txHash = await ganNguoiLam(job.escrowId, selectedApp.walletAddress);
        
        if (!txHash) {
          throw new Error("Không thể thực hiện thao tác");
        }

        const res = await api.acceptApplication(jobId, selectedApp.id, txHash);
        if (res.status === "SUCCESS") {
          toast.success("Đã chấp nhận người làm!");
          setApplications((apps) =>
            apps.map((a) =>
              a.id === selectedApp.id
                ? { ...a, status: "ACCEPTED" as ApplicationStatus }
                : a.status === "PENDING"
                  ? { ...a, status: "REJECTED" as ApplicationStatus }
                  : a
            )
          );
          setShowConfirmDialog(false);
        } else {
          toast.error(res.message || "Thao tác thất bại");
        }
      } else {
        const res = await api.rejectApplication(jobId, selectedApp.id);
        if (res.status === "SUCCESS") {
          toast.success("Đã từ chối người làm");
          setApplications((apps) =>
            apps.map((a) =>
              a.id === selectedApp.id
                ? { ...a, status: "REJECTED" as ApplicationStatus }
                : a
            )
          );
          setShowConfirmDialog(false);
        } else {
          toast.error(res.message || "Thao tác thất bại");
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra");
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Danh sách người làm</h1>
        <p className="text-gray-500 mt-1">Công việc: {job?.title}</p>
      </div>


      {/* Filter & Batch Actions */}
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
            {selectedPendingIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowBatchRejectDialog(true)}
              >
                <Icon name="close" size={16} />
                Từ chối {selectedPendingIds.length} người
              </Button>
            )}
          </div>
          <span className="text-sm text-gray-500">
            Tổng: {filteredApplications.length} người làm
            {pendingApplications.length > 0 && ` (${pendingApplications.length} chờ duyệt)`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="inbox" size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có người làm nào ứng tuyển</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    {pendingApplications.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedPendingIds.length === pendingApplications.length && pendingApplications.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#00b14f] focus:ring-[#00b14f]"
                        title="Chọn tất cả đang chờ duyệt"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người làm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ ví</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kỹ năng</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày ứng tuyển</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className={`hover:bg-gray-50 ${selectedIds.has(app.id) ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3">
                      {app.status === "PENDING" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => toggleSelect(app.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#00b14f] focus:ring-[#00b14f]"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {app.freelancer.avatarUrl ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={app.freelancer.avatarUrl} alt={app.freelancer.fullName} />
                            <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                              {app.freelancer.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        ) : app.freelancer.walletAddress ? (
                          <WalletAvatar address={app.freelancer.walletAddress} size={40} />
                        ) : (
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                              {app.freelancer.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{app.freelancer.fullName}</p>
                          {app.coverLetter && (
                            <button
                              onClick={() => { setViewingApp(app); setShowCoverLetterDialog(true); }}
                              className="text-xs text-[#00b14f] hover:underline block"
                            >
                              Xem thư ứng tuyển
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {app.walletAddress ? (
                        <span className="font-mono text-xs text-gray-600">
                          {app.walletAddress.slice(0, 8)}...{app.walletAddress.slice(-6)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Chưa có</span>
                      )}
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
                            disabled={processingId === app.id || !app.walletAddress}
                            className="text-[#00b14f] hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!app.walletAddress ? "Người làm chưa có địa chỉ ví" : ""}
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
              {confirmAction === "accept" ? "Chấp nhận người làm" : "Từ chối người làm"}
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
              Danh sách kỹ năng của người làm
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
            <DialogTitle>Thư ứng tuyển</DialogTitle>
          </DialogHeader>
          <div className="border border-gray-200 rounded-lg bg-white">
            {/* Email Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium text-gray-500 w-12">Từ:</span>
                <span className="text-gray-800">{viewingApp?.freelancer.fullName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <span className="font-medium text-gray-500 w-12">Ngày:</span>
                <span className="text-gray-800">
                  {viewingApp?.createdAt ? new Date(viewingApp.createdAt).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  }) : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <span className="font-medium text-gray-500 w-12">V/v:</span>
                <span className="text-gray-800">Ứng tuyển vị trí công việc</span>
              </div>
            </div>
            {/* Email Body */}
            <div className="px-4 py-4">
              {viewingApp?.coverLetter ? (
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingApp.coverLetter}</div>
              ) : (
                <p className="text-gray-400 italic">Không có nội dung thư</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoverLetterDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Reject Dialog */}
      <Dialog open={showBatchRejectDialog} onOpenChange={(o) => !isBatchProcessing && setShowBatchRejectDialog(o)}>
        <DialogContent
          showCloseButton={!isBatchProcessing}
          onPointerDownOutside={(e) => isBatchProcessing && e.preventDefault()}
          onEscapeKeyDown={(e) => isBatchProcessing && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Từ chối hàng loạt</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn từ chối {selectedPendingIds.length} người làm đã chọn?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-gray-600 mb-2">Danh sách sẽ bị từ chối:</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {applications
                .filter(app => selectedPendingIds.includes(app.id))
                .map(app => (
                  <div key={app.id} className="flex items-center gap-2 text-sm py-1 px-2 bg-gray-50 rounded">
                    {app.freelancer.avatarUrl ? (
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={app.freelancer.avatarUrl} />
                        <AvatarFallback className="bg-gray-200 text-xs">
                          {app.freelancer.fullName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : app.freelancer.walletAddress ? (
                      <WalletAvatar address={app.freelancer.walletAddress} size={24} />
                    ) : (
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-gray-200 text-xs">
                          {app.freelancer.fullName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span>{app.freelancer.fullName}</span>
                  </div>
                ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchRejectDialog(false)} disabled={isBatchProcessing}>
              Hủy
            </Button>
            <Button
              onClick={handleBatchReject}
              disabled={isBatchProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBatchProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Icon name="close" size={16} />
                  Từ chối tất cả
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
