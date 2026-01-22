import { useState } from "react";
import { toast } from "sonner";
import { api, Dispute } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export function useDisputeSignature(
  dispute: Dispute,
  userRole: "employer" | "freelancer" | "admin",
  onSuccess?: () => void,
  onClose?: () => void
) {
  const { isConnected, connect, isConnecting, kyXacNhan } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alreadySigned = false;

  const handleSign = async () => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để ký xác nhận");
        return;
      }
    }

    if (!dispute.escrowId) {
      toast.error("Không tìm thấy thông tin escrow");
      return;
    }

    setIsSubmitting(true);
    try {
      const txHash = await kyXacNhan(dispute.escrowId);
      
      if (!txHash) {
        throw new Error("Không thể ký xác nhận");
      }

      const response = await api.signDispute(dispute.id, userRole, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Đã ký xác nhận thành công!");
        onClose?.();
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error signing dispute:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi ký xác nhận");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isConnected,
    isConnecting,
    connect,
    alreadySigned,
    handleSign,
  };
}
