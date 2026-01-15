"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
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

interface CreateDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  onSuccess?: () => void;
}

export default function CreateDisputeDialog({
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
