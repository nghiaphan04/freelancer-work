"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WithdrawApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  jobTitle?: string;
  isLoading: boolean;
  onWithdraw: () => void;
}

export default function WithdrawApplicationDialog({
  open,
  onClose,
  jobTitle,
  isLoading,
  onWithdraw,
}: WithdrawApplicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Rút đơn ứng tuyển</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn rút đơn ứng tuyển cho công việc &quot;{jobTitle}&quot;?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-600 flex items-start gap-2">
            <Icon name="info" size={18} className="shrink-0 mt-0.5" />
            <span>Sau khi rút đơn, bạn có thể ứng tuyển lại.</span>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={onWithdraw}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              "Rút đơn"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
