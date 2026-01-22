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

interface JobWithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  jobTitle?: string;
  reason: string;
  onReasonChange: (value: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onWithdraw: () => void;
  penaltyAmount?: number;
}

export default function JobWithdrawDialog({
  open,
  onClose,
  jobTitle,
  reason,
  onReasonChange,
  isLoading,
  isConnected,
  isConnecting,
  onConnect,
  onWithdraw,
  penaltyAmount,
}: JobWithdrawDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Xin rút khỏi công việc</DialogTitle>
          <DialogDescription>{jobTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wallet Status */}
          {!isConnected && (
            <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="account_balance_wallet" size={18} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Cần kết nối ví để thực hiện
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={onConnect}
                  disabled={isConnecting}
                  className="bg-[#00b14f] hover:bg-[#009643]"
                >
                  {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                </Button>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-gray-100 border border-gray-300 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="warning" size={20} className="text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium">Lưu ý khi rút</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>
                    <span className="font-medium">Phí phạt 12%: </span>
                    {penaltyAmount !== undefined ? (
                      <span className="font-semibold">{penaltyAmount.toFixed(4)} APT</span>
                    ) : (
                      <span>Đang tính...</span>
                    )}
                  </li>
                  <li>Điểm uy tín sẽ bị trừ (Bất tín nhiệm +10, Tín nhiệm -5)</li>
                  <li>Không thể hoàn tác sau khi thực hiện</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do xin rút <span className="text-gray-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Nhập lý do bạn muốn rút khỏi công việc này..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b14f] focus:border-transparent resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={onWithdraw}
            disabled={isLoading || !reason.trim()}
            className="bg-gray-600 hover:bg-gray-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
