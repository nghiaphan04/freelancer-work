"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, Dispute, DISPUTE_STATUS_CONFIG, DisputeFileAttachment } from "@/lib/api";
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

type EvidenceMeta = {
  url: string;
  fileId?: number;
  name?: string;
  size?: number;
};

const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const EvidenceCard = ({
  url,
  name,
  size,
  label,
  onRemove,
}: {
  url: string;
  name?: string;
  size?: string;
  label?: string;
  onRemove?: () => void;
}) => (
  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors">
    <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
    <div className="flex-1 text-sm text-gray-700 truncate">
      <span className="font-medium">{name || label || "Tệp đính kèm"}</span>
      {size && <span className="block text-xs text-gray-500">{size}</span>}
    </div>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="text-gray-500 hover:text-gray-700"
    >
      <Icon name="download" size={18} />
    </a>
    {onRemove && (
      <button onClick={onRemove} className="text-gray-500 hover:text-gray-700">
        <Icon name="close" size={18} />
      </button>
    )}
  </div>
);

const renderEvidenceCard = (
  attachment?: DisputeFileAttachment,
  fallbackUrl?: string,
  label?: string
) => {
  const url = attachment?.secureUrl || fallbackUrl;
  if (!url) return null;
  return (
    <EvidenceCard
      url={url}
      name={attachment?.originalFilename || label}
      size={attachment?.readableSize}
      label={label}
    />
  );
};

interface CreateDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  onSuccess?: () => void;
}

export function CreateDisputeDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: CreateDisputeDialogProps) {
  const [description, setDescription] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceMeta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả sai phạm");
      return;
    }
    if (!selectedEvidence?.url?.trim()) {
      toast.error("Vui lòng upload file bằng chứng (PDF)");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createDispute(
        jobId,
        description,
        selectedEvidence?.url ?? "",
        selectedEvidence?.fileId
      );
      if (response.status === "SUCCESS") {
        toast.success("Đã tạo khiếu nại thành công. Chờ admin xử lý.");
        setDescription("");
        setSelectedEvidence(null);
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
              placeholder="Mô tả chi tiết sai phạm của người làm..."
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

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-1 flex items-center gap-1">
              <Icon name="info" size={16} />
              Lưu ý:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-5">
              <li>Công việc sẽ bị khóa cho đến khi quản trị viên giải quyết</li>
              <li>Tiền ký quỹ sẽ được giữ lại</li>
              <li>Người làm sẽ được thông báo và có cơ hội phản hồi</li>
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
            className="bg-gray-600 hover:bg-gray-700"
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

export function DisputeResponseDialog({
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

interface ViewDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute | null;
}

export function ViewDisputeDialog({
  open,
  onOpenChange,
  dispute,
}: ViewDisputeDialogProps) {
  if (!dispute) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="gavel" size={20} className="text-gray-500" />
            Chi tiết khiếu nại
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {dispute.statusLabel}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">
              Khiếu nại từ bên thuê: {dispute.employer.fullName}
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.employerDescription}</p>
            {dispute.employerEvidenceUrl && (
              <a
                href={dispute.employerEvidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-2 mt-3 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors"
              >
                <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-700">Bằng chứng đính kèm</span>
                <Icon name="download" size={18} className="text-gray-500 shrink-0" />
              </a>
            )}
          </div>

          {dispute.freelancerDescription ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Phản hồi từ người làm: {dispute.freelancer.fullName}
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.freelancerDescription}</p>
              {dispute.freelancerEvidenceUrl && (
                <a
                  href={dispute.freelancerEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 mt-3 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors"
                >
                  <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
                  <span className="flex-1 text-sm text-gray-700">Bằng chứng đính kèm</span>
                  <Icon name="download" size={18} className="text-gray-500 shrink-0" />
                </a>
              )}
            </div>
          ) : dispute.freelancerDeadline ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">
                Chờ người làm phản hồi
              </h4>
              <p className="text-sm text-gray-600">
                Hạn: {formatDateTime(dispute.freelancerDeadline)}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Chưa yêu cầu người làm phản hồi
              </p>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
