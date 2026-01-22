"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  walletAddress: string | null;
  isWalletConnected: boolean;
  onConnectWallet: () => void;
  isWalletConnecting: boolean;
}

export default function JobApplyDialog({
  open,
  onOpenChange,
  jobTitle,
  coverLetter,
  onCoverLetterChange,
  onSubmit,
  isLoading,
  walletAddress,
  isWalletConnected,
  onConnectWallet,
  isWalletConnecting,
}: JobApplyDialogProps) {
  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle>Ứng tuyển công việc</DialogTitle>
          <DialogDescription>
            Gửi đơn ứng tuyển cho công việc &quot;{jobTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Wallet Connect Prompt - Only show when not connected */}
          {!isWalletConnected && (
            <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="account_balance_wallet" size={18} className="text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">Cần kết nối ví Aptos</p>
                </div>
                <Button
                  size="sm"
                  onClick={onConnectWallet}
                  disabled={isWalletConnecting || isLoading}
                  className="bg-[#00b14f] hover:bg-[#009643]"
                >
                  {isWalletConnecting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      Đang kết nối
                    </>
                  ) : (
                    "Kết nối ví"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Cover Letter - Email Format */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-500">Thư ứng tuyển</p>
            </div>
            <Textarea
              id="coverLetter"
              placeholder={`Kính gửi Nhà tuyển dụng,

Tôi viết thư này để bày tỏ sự quan tâm của mình đối với vị trí "${jobTitle}".

[Giới thiệu về bản thân và kinh nghiệm liên quan]

[Lý do bạn phù hợp với công việc này]

Trân trọng,
[Tên của bạn]`}
              value={coverLetter}
              onChange={(e) => onCoverLetterChange(e.target.value)}
              disabled={isLoading}
              className="border-0 rounded-none min-h-[200px] focus-visible:ring-0 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isLoading || !isWalletConnected} 
            className="bg-[#00b14f] hover:bg-[#009643]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Icon name="send" size={16} />
                Gửi ứng tuyển
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
