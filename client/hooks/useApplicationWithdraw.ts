import { useState } from "react";
import { toast } from "sonner";
import { api, JobApplication } from "@/lib/api";

export function useApplicationWithdraw(
  onSuccess?: (appId: number) => void
) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = (app: JobApplication) => {
    setSelectedApp(app);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!isLoading) {
      setDialogOpen(false);
      setSelectedApp(null);
    }
  };

  const withdraw = async () => {
    if (!selectedApp) return;
    
    setIsLoading(true);
    try {
      const res = await api.withdrawApplication(selectedApp.id);
      if (res.status === "SUCCESS") {
        toast.success("Đã rút đơn ứng tuyển thành công");
        onSuccess?.(selectedApp.id);
        closeDialog();
      } else {
        toast.error(res.message || "Không thể rút đơn");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dialogOpen,
    selectedApp,
    isLoading,
    openDialog,
    closeDialog,
    withdraw,
  };
}
