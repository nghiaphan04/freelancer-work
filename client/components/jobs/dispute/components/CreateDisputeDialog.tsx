"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { useCreateDispute, EvidenceMeta } from "@/hooks/useCreateDispute";
import { EvidenceCard, formatFileSize } from "./EvidenceCard";

interface CreateDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  escrowId?: number;
  onSuccess?: () => void;
}

export function CreateDisputeDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  escrowId,
  onSuccess,
}: CreateDisputeDialogProps) {
  const {
    description,
    setDescription,
    selectedEvidence,
    setSelectedEvidence,
    isSubmitting,
    isConnected,
    isConnecting,
    connect,
    handleSubmit,
  } = useCreateDispute(jobId, escrowId, onSuccess, () => onOpenChange(false));

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
          {!isConnected && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="warning" size={18} className="text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Cần kết nối ví để mở tranh chấp trên blockchain
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={connect}
                  disabled={isConnecting}
                  className="bg-[#00b14f] hover:bg-[#009643]"
                >
                  {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                </Button>
              </div>
            </div>
          )}

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
              Luu y:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-5">
              <li>Cong viec se bi khoa cho den khi giai quyet tranh chap</li>
              <li>Tien ky quy se duoc giu lai tren smart contract</li>
              <li>Nguoi lam co 3 phut de gui bang chung phan hoi</li>
              <li>3 admin se duoc chon ngau nhien de vote (2/3 thang)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isConnected}
            className="bg-gray-600 hover:bg-gray-700"
          >
            {isSubmitting ? "Đang xử lý..." : "Gửi khiếu nại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
