"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, Dispute, DISPUTE_STATUS_CONFIG } from "@/lib/api";
import { Page } from "@/types/job";
import { formatDateTime, formatCurrency } from "@/lib/format";
import { Pagination } from "@/components/ui/pagination";
import AdminLoading from "../shared/AdminLoading";
import AdminPageHeader from "../shared/AdminPageHeader";
import AdminEmptyState from "../shared/AdminEmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Dialog states
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [requestResponseDialogOpen, setRequestResponseDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [daysToRespond, setDaysToRespond] = useState(3);
  const [resolveNote, setResolveNote] = useState("");
  const [employerWins, setEmployerWins] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDisputes = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await api.adminGetPendingDisputes({ page: pageNum, size: 10 });
      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<Dispute>;
        setDisputes(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.adminCountPendingDisputes();
      if (response.status === "SUCCESS") {
        setPendingCount(response.data);
      }
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

  useEffect(() => {
    fetchDisputes(page);
    fetchPendingCount();
  }, [page]);

  const handleViewDetail = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDetailDialogOpen(true);
  };

  const handleRequestResponse = async () => {
    if (!selectedDispute) return;
    setIsProcessing(true);
    try {
      const response = await api.adminRequestDisputeResponse(selectedDispute.id, daysToRespond);
      if (response.status === "SUCCESS") {
        toast.success(`Đã gửi yêu cầu phản hồi. Freelancer có ${daysToRespond} ngày để phản hồi.`);
        setRequestResponseDialogOpen(false);
        fetchDisputes(page);
        fetchPendingCount();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || employerWins === null || !resolveNote.trim()) {
      toast.error("Vui lòng chọn bên thắng và nhập ghi chú");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.adminResolveDispute(selectedDispute.id, employerWins, resolveNote);
      if (response.status === "SUCCESS") {
        toast.success(`Đã giải quyết tranh chấp. ${employerWins ? "Employer" : "Freelancer"} thắng.`);
        setResolveDialogOpen(false);
        setResolveNote("");
        setEmployerWins(null);
        fetchDisputes(page);
        fetchPendingCount();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const openRequestDialog = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDaysToRespond(3);
    setRequestResponseDialogOpen(true);
  };

  const openResolveDialog = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolveNote("");
    setEmployerWins(null);
    setResolveDialogOpen(true);
  };

  if (isLoading && disputes.length === 0) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quản lý khiếu nại"
        totalElements={totalElements}
        badge={pendingCount > 0 ? { count: pendingCount, label: "đang chờ" } : undefined}
      />

      {disputes.length === 0 ? (
        <AdminEmptyState message="Không có khiếu nại nào đang chờ xử lý" />
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">{dispute.jobTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">#{dispute.id} • Job #{dispute.jobId}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    dispute.status === "PENDING_FREELANCER_RESPONSE" ? "bg-orange-100 text-orange-700" :
                    dispute.status === "PENDING_ADMIN_DECISION" ? "bg-blue-100 text-blue-700" :
                    dispute.status === "EMPLOYER_WON" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {dispute.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Employer</p>
                    <p className="font-medium text-gray-900 truncate">{dispute.employer.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Freelancer</p>
                    <p className="font-medium text-gray-900 truncate">{dispute.freelancer.fullName}</p>
                  </div>
                </div>

                {dispute.freelancerDeadline && (
                  <p className="text-xs text-orange-600">
                    Hạn phản hồi: {formatDateTime(dispute.freelancerDeadline)}
                  </p>
                )}

                <p className="text-xs text-gray-500">{formatDateTime(dispute.createdAt)}</p>

                <div className="pt-2 border-t flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewDetail(dispute)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Xem chi tiết
                  </button>
                  {dispute.status === "PENDING_FREELANCER_RESPONSE" && !dispute.freelancerDeadline && (
                    <button
                      onClick={() => openRequestDialog(dispute)}
                      className="text-orange-600 hover:underline text-sm"
                    >
                      Yêu cầu phản hồi
                    </button>
                  )}
                  {(dispute.status === "PENDING_ADMIN_DECISION" || 
                    (dispute.status === "PENDING_FREELANCER_RESPONSE" && dispute.freelancerDeadline)) && (
                    <button
                      onClick={() => openResolveDialog(dispute)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Quyết định
                    </button>
                  )}
                </div>
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hạn phản hồi</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{dispute.jobTitle}</p>
                        <p className="text-xs text-gray-500">#{dispute.id}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{dispute.employer.fullName}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{dispute.freelancer.fullName}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          dispute.status === "PENDING_FREELANCER_RESPONSE" ? "bg-orange-100 text-orange-700" :
                          dispute.status === "PENDING_ADMIN_DECISION" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {dispute.statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {dispute.freelancerDeadline ? formatDateTime(dispute.freelancerDeadline) : "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{formatDateTime(dispute.createdAt)}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <button
                            onClick={() => handleViewDetail(dispute)}
                            className="text-blue-600 hover:underline"
                          >
                            Chi tiết
                          </button>
                          {dispute.status === "PENDING_FREELANCER_RESPONSE" && !dispute.freelancerDeadline && (
                            <button
                              onClick={() => openRequestDialog(dispute)}
                              className="text-orange-600 hover:underline"
                            >
                              Yêu cầu
                            </button>
                          )}
                          {(dispute.status === "PENDING_ADMIN_DECISION" || 
                            (dispute.status === "PENDING_FREELANCER_RESPONSE" && dispute.freelancerDeadline)) && (
                            <button
                              onClick={() => openResolveDialog(dispute)}
                              className="text-green-600 hover:underline"
                            >
                              Quyết định
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết khiếu nại #{selectedDispute?.id}</DialogTitle>
            <DialogDescription>
              Công việc: {selectedDispute?.jobTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Trạng thái:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  DISPUTE_STATUS_CONFIG[selectedDispute.status]?.color || "text-gray-600"
                }`}>
                  {selectedDispute.statusLabel}
                </span>
              </div>

              {/* Employer complaint */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  📋 Khiếu nại từ Employer: {selectedDispute.employer.fullName}
                </h4>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{selectedDispute.employerDescription}</p>
                {selectedDispute.employerEvidenceUrl && (
                  <a
                    href={selectedDispute.employerEvidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm text-red-600 hover:underline"
                  >
                    📎 Xem bằng chứng
                  </a>
                )}
              </div>

              {/* Freelancer response */}
              {selectedDispute.freelancerDescription ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    💬 Phản hồi từ Freelancer: {selectedDispute.freelancer.fullName}
                  </h4>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">{selectedDispute.freelancerDescription}</p>
                  {selectedDispute.freelancerEvidenceUrl && (
                    <a
                      href={selectedDispute.freelancerEvidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                    >
                      📎 Xem bằng chứng
                    </a>
                  )}
                </div>
              ) : selectedDispute.freelancerDeadline ? (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-1">
                    ⏳ Chờ freelancer phản hồi
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Hạn: {formatDateTime(selectedDispute.freelancerDeadline)}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Chưa yêu cầu freelancer phản hồi
                  </p>
                </div>
              )}

              {/* Admin decision */}
              {selectedDispute.adminNote && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">
                    ⚖️ Quyết định của Admin
                  </h4>
                  <p className="text-sm text-purple-700">{selectedDispute.adminNote}</p>
                  {selectedDispute.resolvedBy && (
                    <p className="text-xs text-purple-600 mt-2">
                      Người xử lý: {selectedDispute.resolvedBy.fullName} - {formatDateTime(selectedDispute.resolvedAt!)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Response Dialog */}
      <Dialog open={requestResponseDialogOpen} onOpenChange={setRequestResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu freelancer phản hồi</DialogTitle>
            <DialogDescription>
              Gửi yêu cầu để {selectedDispute?.freelancer.fullName} có thể gửi bằng chứng và giải thích
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số ngày phản hồi
              </label>
              <select
                value={daysToRespond}
                onChange={(e) => setDaysToRespond(Number(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-md"
              >
                <option value={1}>1 ngày</option>
                <option value={2}>2 ngày</option>
                <option value={3}>3 ngày</option>
                <option value={5}>5 ngày</option>
                <option value={7}>7 ngày</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestResponseDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRequestResponse} disabled={isProcessing}>
              {isProcessing ? "Đang xử lý..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quyết định tranh chấp</DialogTitle>
            <DialogDescription>
              Chọn bên thắng và nhập ghi chú quyết định
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn bên thắng
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEmployerWins(true)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    employerWins === true 
                      ? "border-green-500 bg-green-50 text-green-700" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium">Employer thắng</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedDispute?.employer.fullName}</p>
                </button>
                <button
                  onClick={() => setEmployerWins(false)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    employerWins === false 
                      ? "border-green-500 bg-green-50 text-green-700" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium">Freelancer thắng</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedDispute?.freelancer.fullName}</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú quyết định <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="Nhập lý do quyết định..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {employerWins !== null && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                <p className="font-medium mb-1">Kết quả:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{employerWins ? "Employer" : "Freelancer"} nhận tiền escrow</li>
                  <li>{employerWins ? "Freelancer" : "Employer"} bị +1 KUT, -1 UT</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={isProcessing || employerWins === null || !resolveNote.trim()}
            >
              {isProcessing ? "Đang xử lý..." : "Xác nhận quyết định"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
