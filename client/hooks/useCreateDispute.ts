import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export type EvidenceMeta = {
  url: string;
  fileId?: number;
  name?: string;
  size?: number;
};

export function useCreateDispute(
  jobId: number,
  escrowId?: number,
  onSuccess?: () => void,
  onClose?: () => void
) {
  const { isConnected, connect, isConnecting, moTranhChap, account } = useWallet();
  const [description, setDescription] = useState("Sản phẩm không đạt yêu cầu như đã thỏa thuận trong hợp đồng. Cụ thể:\n- Thiếu chức năng A\n- Giao diện không responsive\n- Không có tài liệu hướng dẫn");
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
      // Blockchain call is REQUIRED
      if (!escrowId) {
        throw new Error("Không tìm thấy escrow ID");
      }

      // Bước 1: Gọi blockchain trước (BẮT BUỘC)
      const result = await moTranhChap(escrowId);
      if (!result) {
        throw new Error("Không thể tạo khiếu nại trên blockchain");
      }

      // Bước 2: Tạo dispute trong database với blockchainDisputeId từ event
      const response = await api.createDispute(
        jobId,
        description,
        selectedEvidence?.url ?? "",
        selectedEvidence?.fileId,
        result.txHash,
        account?.address,
        result.disputeId
      );
      if (response.status === "SUCCESS") {
        toast.success("Đã tạo khiếu nại thành công. Chờ admin xử lý.");
        setDescription("");
        setSelectedEvidence(null);
        onClose?.();
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi tạo khiếu nại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    description,
    setDescription,
    selectedEvidence,
    setSelectedEvidence,
    isSubmitting,
    isConnected,
    isConnecting,
    connect,
    handleSubmit,
  };
}
