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
import { Job } from "@/types/job";

interface DeleteJobDialogProps {
  open: boolean;
  onClose: () => void;
  job: Job | null;
  isDeleting: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onConfirm: () => void;
}

export default function DeleteJobDialog({
  open,
  onClose,
  job,
  isDeleting,
  isConnected,
  isConnecting,
  onConnect,
  onConfirm,
}: DeleteJobDialogProps) {
  const needWallet = Boolean(job?.escrowId);
  const canConfirm = !needWallet || isConnected;

  return (
    <Dialog open={open} onOpenChange={(o) => !isDeleting && onClose()}>
      <DialogContent showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Xác nhận hủy công việc</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn hủy công việc này?
          </DialogDescription>
        </DialogHeader>
        
        {job && (
          <div className="py-4 space-y-3">
            <p className="font-medium text-gray-900">#{job.id} - {job.title}</p>
            
            {job.escrowId ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon name="info" size={20} className="mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p>Tiền ký quỹ sẽ được hoàn lại vào ví của bạn.</p>
                    <p className="mt-1 text-green-700">Cần kết nối ví để xác nhận hoàn tiền.</p>
                  </div>
                </div>
                
                {!isConnected && (
                  <Button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="mt-3 w-full bg-[#00b14f] hover:bg-[#009643]"
                  >
                    {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                  </Button>
                )}
                
                {isConnected && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <Icon name="check_circle" size={14} />
                    Ví đã kết nối, sẵn sàng hủy
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Công việc sẽ chuyển sang trạng thái Đã hủy.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Đóng
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting || !canConfirm}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang hủy...
              </>
            ) : (
              <>
                <Icon name="cancel" size={16} />
                Hủy công việc
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
