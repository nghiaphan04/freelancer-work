"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
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
  escrowId?: number;
  onSuccess?: () => void;
}

export default function CreateDisputeDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  escrowId,
  onSuccess,
}: CreateDisputeDialogProps) {
  const { isConnected, connect, isConnecting, moTranhChap, getAptosExplorerUrl, account } = useWallet();
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

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để tạo khiếu nại");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let blockchainTxHash: string | undefined;
      
      // Blockchain call is REQUIRED
      if (!escrowId) {
        toast.error("Không tìm thấy escrow ID");
        setIsSubmitting(false);
        return;
      }
      
      if (!isConnected) {
        toast.error("Vui lòng kết nối ví trước");
        setIsSubmitting(false);
        return;
      }

      let blockchainDisputeId: number | undefined;
      
      try {
        toast.info("Đang mở tranh chấp trên blockchain...");
        const result = await moTranhChap(escrowId);
        if (!result) {
          toast.error("Không thể tạo tranh chấp trên blockchain");
          setIsSubmitting(false);
          return;
        }
        blockchainTxHash = result.txHash;
        blockchainDisputeId = result.disputeId;
        
        toast.success(
          <div>
            <p>Đã mở tranh chấp trên blockchain! (ID: {blockchainDisputeId})</p>
            <a 
              href={getAptosExplorerUrl(result.txHash)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 underline text-sm"
            >
              Xem giao dịch
            </a>
          </div>
        );
        
      } catch (e: any) {
        console.error("Blockchain dispute error:", e);
        if (e.message?.includes("User rejected")) {
          toast.error("Bạn đã hủy thao tác");
        } else {
          toast.error("Lỗi blockchain: " + (e.message || "Không thể tạo tranh chấp"));
        }
        setIsSubmitting(false);
        return;
      }

      const response = await api.createDispute(
        jobId,
        description,
        selectedEvidence?.url ?? "",
        selectedEvidence?.fileId,
        blockchainTxHash,
        account?.address,
        blockchainDisputeId
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
          {/* Wallet Status */}
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
              Lưu ý:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-5">
              <li>Công việc sẽ bị khóa cho đến khi quản trị viên giải quyết</li>
              <li>Tiền ký quỹ sẽ được giữ lại trên smart contract</li>
              <li>Người làm sẽ được thông báo và có cơ hội phản hồi</li>
              <li>Admin sẽ quyết định và các bên cần ký xác nhận trên blockchain</li>
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
