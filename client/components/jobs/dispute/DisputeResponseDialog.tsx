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
import { FileUpload } from "@/components/ui/file-upload";
import EvidenceCard, { EvidenceMeta, formatFileSize } from "./EvidenceCard";
import renderEvidenceCard from "./renderEvidenceCard";

interface DisputeResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute;
  onSuccess?: () => void;
}

export default function DisputeResponseDialog({
  open,
  onOpenChange,
  dispute,
  onSuccess,
}: DisputeResponseDialogProps) {
  const [description, setDescription] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceMeta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    if (!selectedEvidence?.url?.trim()) {
      toast.error("Vui lòng upload file bằng chứng (PDF)");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitDisputeResponse(
        dispute.id,
        description,
        selectedEvidence?.url ?? "",
        selectedEvidence?.fileId
      );
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi phản hồi thành công. Chờ admin quyết định.");
        setDescription("");
        setSelectedEvidence(null);
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
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="gavel" size={20} className="text-gray-500" />
            Thông tin khiếu nại
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              DISPUTE_STATUS_CONFIG[dispute.status]?.color || "text-gray-600"
            }`}>
              {dispute.statusLabel}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">
              Khiếu nại từ: {dispute.employer.fullName}
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.employerDescription}</p>
            {renderEvidenceCard(dispute.employerEvidenceFile, dispute.employerEvidenceUrl, "Bằng chứng bên thuê")}
          </div>

          {dispute.freelancerDeadline && canRespond && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border border-gray-200">
              <p className="font-medium">
                Hạn phản hồi: {formatDateTime(dispute.freelancerDeadline)}
              </p>
            </div>
          )}

          {dispute.freelancerDescription && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Phản hồi của bạn
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.freelancerDescription}</p>
              {renderEvidenceCard(dispute.freelancerEvidenceFile, dispute.freelancerEvidenceUrl, "Bằng chứng phản hồi")}
            </div>
          )}

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

              <FileUpload
                value={selectedEvidence?.url || ""}
                onChange={(url, file, fileId) => {
                  if (!url) {
                    setSelectedEvidence(null);
                    return;
                  }
                  setSelectedEvidence({
                    url,
                    fileId,
                    name: file?.name,
                    size: file?.size,
                  });
                }}
                usage="DISPUTE_EVIDENCE"
                label="Bằng chứng (PDF)"
                required
                disabled={isSubmitting}
              />

              {selectedEvidence && (
                <EvidenceCard
                  url={selectedEvidence.url}
                  name={selectedEvidence.name}
                  size={formatFileSize(selectedEvidence.size)}
                  label="Bằng chứng đã chọn"
                  onRemove={() => setSelectedEvidence(null)}
                />
              )}
            </>
          )}

          {!canRespond && !dispute.freelancerDescription && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p>Đã hết thời hạn phản hồi hoặc khiếu nại đang chờ quản trị viên quyết định.</p>
            </div>
          )}

          {dispute.adminNote && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Quyết định của quản trị viên
              </h4>
              <p className="text-sm text-gray-600">{dispute.adminNote}</p>
              {dispute.resolvedBy && (
                <p className="text-xs text-gray-500 mt-2">
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
