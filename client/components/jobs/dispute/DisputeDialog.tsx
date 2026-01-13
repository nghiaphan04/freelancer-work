"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, Dispute, DISPUTE_STATUS_CONFIG } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/Icon";

interface CreateDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  onSuccess?: () => void;
}

// Dialog cho Employer tạo khiếu nại
export function CreateDisputeDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: CreateDisputeDialogProps) {
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả sai phạm");
      return;
    }
    if (!evidenceUrl.trim()) {
      toast.error("Vui lòng cung cấp link bằng chứng (PDF)");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createDispute(jobId, description, evidenceUrl);
      if (response.status === "SUCCESS") {
        toast.success("Đã tạo khiếu nại thành công. Chờ admin xử lý.");
        setDescription("");
        setEvidenceUrl("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo khiếu nại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="report_problem" size={20} className="text-red-500" />
            Tạo khiếu nại
          </DialogTitle>
          <DialogDescription>
            Khiếu nại về sản phẩm của công việc: <strong>{jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả sai phạm <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết sai phạm của freelancer..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link bằng chứng (PDF) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/xxx/evidence.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload file PDF lên Google Drive hoặc dịch vụ lưu trữ và dán link ở đây
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
            <p className="font-medium mb-1">⚠️ Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Công việc sẽ bị khóa cho đến khi admin giải quyết</li>
              <li>Tiền escrow sẽ được giữ lại</li>
              <li>Freelancer sẽ được thông báo và có cơ hội phản hồi</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Đang xử lý..." : "Gửi khiếu nại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DisputeResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute;
  onSuccess?: () => void;
}

// Dialog cho Freelancer phản hồi khiếu nại
export function DisputeResponseDialog({
  open,
  onOpenChange,
  dispute,
  onSuccess,
}: DisputeResponseDialogProps) {
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    if (!evidenceUrl.trim()) {
      toast.error("Vui lòng cung cấp link bằng chứng (PDF)");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitDisputeResponse(dispute.id, description, evidenceUrl);
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi phản hồi thành công. Chờ admin quyết định.");
        setDescription("");
        setEvidenceUrl("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi phản hồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canRespond = dispute.status === "PENDING_FREELANCER_RESPONSE" && 
    (!dispute.freelancerDeadline || new Date(dispute.freelancerDeadline) > new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="gavel" size={20} className="text-orange-500" />
            Thông tin khiếu nại
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              DISPUTE_STATUS_CONFIG[dispute.status]?.color || "text-gray-600"
            }`}>
              {dispute.statusLabel}
            </span>
          </div>

          {/* Employer complaint */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">
              📋 Khiếu nại từ: {dispute.employer.fullName}
            </h4>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{dispute.employerDescription}</p>
            {dispute.employerEvidenceUrl && (
              <a
                href={dispute.employerEvidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-red-600 hover:underline"
              >
                📎 Xem bằng chứng
              </a>
            )}
          </div>

          {/* Deadline warning */}
          {dispute.freelancerDeadline && canRespond && (
            <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-700">
              <p className="font-medium">
                ⏳ Hạn phản hồi: {formatDateTime(dispute.freelancerDeadline)}
              </p>
            </div>
          )}

          {/* Already responded */}
          {dispute.freelancerDescription && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                💬 Phản hồi của bạn
              </h4>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{dispute.freelancerDescription}</p>
              {dispute.freelancerEvidenceUrl && (
                <a
                  href={dispute.freelancerEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                >
                  📎 Xem bằng chứng
                </a>
              )}
            </div>
          )}

          {/* Response form */}
          {canRespond && !dispute.freelancerDescription && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung phản hồi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giải thích và bảo vệ công việc của bạn..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link bằng chứng (PDF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/xxx/response.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
                />
              </div>
            </>
          )}

          {/* Cannot respond anymore */}
          {!canRespond && !dispute.freelancerDescription && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p>Đã hết thời hạn phản hồi hoặc khiếu nại đang chờ admin quyết định.</p>
            </div>
          )}

          {/* Admin decision */}
          {dispute.adminNote && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                ⚖️ Quyết định của Admin
              </h4>
              <p className="text-sm text-purple-700">{dispute.adminNote}</p>
              {dispute.resolvedBy && (
                <p className="text-xs text-purple-600 mt-2">
                  Người xử lý: {dispute.resolvedBy.fullName} - {formatDateTime(dispute.resolvedAt!)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {canRespond && !dispute.freelancerDescription && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-[#00b14f] hover:bg-[#009643]"
            >
              {isSubmitting ? "Đang xử lý..." : "Gửi phản hồi"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ViewDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute | null;
}

// Dialog xem thông tin khiếu nại (cho cả employer và freelancer)
export function ViewDisputeDialog({
  open,
  onOpenChange,
  dispute,
}: ViewDisputeDialogProps) {
  if (!dispute) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="gavel" size={20} className="text-orange-500" />
            Chi tiết khiếu nại
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              dispute.status === "PENDING_FREELANCER_RESPONSE" ? "bg-orange-100 text-orange-700" :
              dispute.status === "PENDING_ADMIN_DECISION" ? "bg-blue-100 text-blue-700" :
              dispute.status === "EMPLOYER_WON" ? "bg-green-100 text-green-700" :
              dispute.status === "FREELANCER_WON" ? "bg-green-100 text-green-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {dispute.statusLabel}
            </span>
          </div>

          {/* Employer complaint */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">
              📋 Khiếu nại từ Employer: {dispute.employer.fullName}
            </h4>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{dispute.employerDescription}</p>
            {dispute.employerEvidenceUrl && (
              <a
                href={dispute.employerEvidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-red-600 hover:underline"
              >
                📎 Xem bằng chứng
              </a>
            )}
          </div>

          {/* Freelancer response */}
          {dispute.freelancerDescription ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                💬 Phản hồi từ Freelancer: {dispute.freelancer.fullName}
              </h4>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{dispute.freelancerDescription}</p>
              {dispute.freelancerEvidenceUrl && (
                <a
                  href={dispute.freelancerEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                >
                  📎 Xem bằng chứng
                </a>
              )}
            </div>
          ) : dispute.freelancerDeadline ? (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-1">
                ⏳ Chờ freelancer phản hồi
              </h4>
              <p className="text-sm text-yellow-700">
                Hạn: {formatDateTime(dispute.freelancerDeadline)}
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
          {dispute.adminNote && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                ⚖️ Quyết định của Admin
              </h4>
              <p className="text-sm text-purple-700">{dispute.adminNote}</p>
              {dispute.resolvedBy && (
                <p className="text-xs text-purple-600 mt-2">
                  Người xử lý: {dispute.resolvedBy.fullName} - {formatDateTime(dispute.resolvedAt!)}
                </p>
              )}
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
