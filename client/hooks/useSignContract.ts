import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

interface JobToSign {
  id: number;
  title: string;
  escrowId?: number;
}

export function useSignContract(onSuccess?: () => void) {
  const { isConnected, kyHopDong, connect } = useWallet();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobToSign | null>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = async (job: JobToSign) => {
    setSelectedJob(job);
    setDialogOpen(true);
    
    try {
      const response = await api.getJobContract(job.id);
      if (response.status === "SUCCESS" && response.data) {
        setContractData(response.data);
      } else {
        toast.error("Không tìm thấy hợp đồng");
        setDialogOpen(false);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải hợp đồng");
      setDialogOpen(false);
    }
  };

  const closeDialog = () => {
    if (!isLoading) {
      setDialogOpen(false);
      setSelectedJob(null);
      setContractData(null);
    }
  };

  const signContract = async () => {
    if (!selectedJob || !contractData) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để ký hợp đồng");
        return;
      }
    }

    if (!selectedJob.escrowId) {
      toast.error("Không tìm thấy thông tin escrow");
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await kyHopDong(selectedJob.escrowId, contractData.contractHash);
      
      if (!txHash) {
        throw new Error("Không thể ký hợp đồng");
      }

      const response = await api.signJobContract(selectedJob.id, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Bạn đã ký hợp đồng và có thể bắt đầu làm việc!");
        closeDialog();
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error signing contract:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi ký hợp đồng");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dialogOpen,
    selectedJob,
    contractData,
    isLoading,
    openDialog,
    closeDialog,
    signContract,
  };
}
