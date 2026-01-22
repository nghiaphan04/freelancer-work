import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { Job } from "@/types/job";

export function useDeleteJob(onSuccess?: () => void | Promise<void>) {
  const { isConnected, isConnecting, connect, huyEscrow } = useWallet();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDialog = (job: Job) => {
    setJobToDelete(job);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!isDeleting) {
      setDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleConnect = async () => {
    await connect();
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    const needCancelEscrow = Boolean(jobToDelete.escrowId);
    
    if (needCancelEscrow && !isConnected) {
      toast.error("Vui lòng kết nối ví để hủy công việc có ký quỹ");
      return;
    }
    
    setIsDeleting(true);
    try {
      let txHash: string | undefined;
      
      if (needCancelEscrow) {
        toast.info("Đang hủy ký quỹ...");
        const result = await huyEscrow(jobToDelete.escrowId!);
        if (!result) {
          throw new Error("Không thể hủy ký quỹ");
        }
        txHash = result;
      }

      const response = await api.deleteJob(jobToDelete.id, txHash);
      if (response.status === "SUCCESS") {
        toast.success(response.message || "Đã hủy công việc");
        setDialogOpen(false);
        setJobToDelete(null);
        await onSuccess?.();
      } else {
        toast.error(response.message || "Không thể hủy công việc");
      }
    } catch (error: any) {
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    dialogOpen,
    jobToDelete,
    isDeleting,
    isConnected,
    isConnecting,
    handleConnect,
    openDialog,
    closeDialog,
    confirmDelete,
  };
}
