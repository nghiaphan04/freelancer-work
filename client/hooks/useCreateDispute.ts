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
  const [description, setDescription] = useState("Bên B chưa hoàn thành đúng yêu cầu như đã thỏa thuận trong hợp đồng. Cụ thể:\n\n1. Bóc tách khối lượng:\n- Thiếu hạng mục cốt thép dầm D1, D2 (theo bản vẽ kết cấu)\n- Tính sai khối lượng bê tông móng: ghi 15.5 m³ nhưng thực tế chỉ 12.3 m³\n- Không bóc tách lớp bảo vệ bê tông và lớp hoàn thiện theo yêu cầu\n\n2. Bản vẽ shopdrawing:\n- Chi tiết cốt thép cột không đúng với bản vẽ thiết kế (thiếu thép chịu lực)\n- Thiếu bản vẽ chi tiết mối nối cốt thép và neo thép\n- Kích thước, khoảng cách cốt đai không đúng theo TCVN 5574:2018\n\n3. BOQ/Dự toán:\n- Áp dụng sai mã hiệu định mức: dùng mã AB.21111 thay vì AB.21112\n- Đơn giá vật liệu không khớp với đơn giá tỉnh/thành phố hiện hành\n- Thiếu tính toán chi phí nhân công và máy thi công");
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
        toast.success("Đã tạo khiếu nại thành công. Chờ trọng tài viên xử lý.");
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
