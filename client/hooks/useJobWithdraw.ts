import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

interface JobToWithdraw {
  id: number;
  title: string;
  escrowId?: number;
}

export function useJobWithdraw(onSuccess?: () => void) {
  const { isConnected, freelancerRut, connect, isConnecting, getWithdrawalPenalty } = useWallet();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobToWithdraw | null>(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState<number | undefined>(undefined);

  // Fetch penalty when dialog opens
  useEffect(() => {
    const fetchPenalty = async () => {
      if (dialogOpen && selectedJob?.escrowId) {
        const penalty = await getWithdrawalPenalty(selectedJob.escrowId);
        setPenaltyAmount(penalty ?? undefined);
      } else {
        setPenaltyAmount(undefined);
      }
    };
    fetchPenalty();
  }, [dialogOpen, selectedJob?.escrowId, getWithdrawalPenalty]);

  const openDialog = (job: JobToWithdraw) => {
    setSelectedJob(job);
    setReason("");
    setPenaltyAmount(undefined);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!isLoading) {
      setDialogOpen(false);
      setSelectedJob(null);
      setReason("");
    }
  };

  const withdraw = async () => {
    if (!selectedJob || !reason.trim()) {
      toast.error("Vui lòng nhập lý do xin rút");
      return;
    }

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để thực hiện");
        return;
      }
    }

    setIsLoading(true);
    try {
      let txHash: string | undefined;
      
      // Bước 1: Gọi blockchain trước
      if (selectedJob.escrowId) {
        const result = await freelancerRut(selectedJob.escrowId);
        if (!result) {
          throw new Error("Không thể thực hiện thao tác");
        }
        txHash = result;
      }

      const response = await api.createFreelancerWithdrawal(selectedJob.id, reason, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Đã rút khỏi công việc thành công");
        closeDialog();
        onSuccess?.();
      } else {
        toast.error(response.message || "Không thể gửi yêu cầu");
      }
    } catch (error: any) {
      console.error("Error withdrawing from job:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dialogOpen,
    selectedJob,
    reason,
    setReason,
    isLoading,
    isConnected,
    isConnecting,
    connect,
    openDialog,
    closeDialog,
    withdraw,
    penaltyAmount,
  };
}
