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
import { Dispute } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useDisputeSignature } from "@/hooks/useDisputeSignature";

interface DisputeSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute;
  userRole: "employer" | "freelancer" | "admin";
  onSuccess?: () => void;
}

export function DisputeSignatureDialog({
  open,
  onOpenChange,
  dispute,
  userRole,
  onSuccess,
}: DisputeSignatureDialogProps) {
  const {
    isSubmitting,
    isConnected,
    isConnecting,
    connect,
    alreadySigned,
    handleSign,
  } = useDisputeSignature(dispute, userRole, onSuccess, () => onOpenChange(false));

  const roleLabel = userRole === "employer" ? "người thuê" : userRole === "freelancer" ? "người làm" : "trọng tài viên";

  const isEmployerWinner = dispute.employerWins || 
    dispute.finalWinnerWallet === dispute.employer.walletAddress ||
    dispute.status === "EMPLOYER_WON" || 
    dispute.status === "EMPLOYER_CLAIMED";

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="verified" size={20} className="text-purple-500" />
            Ký xác nhận tranh chấp
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Quyết định tranh chấp</h4>
            <p className="text-sm text-purple-700">
              {isEmployerWinner 
                ? `Người thuê (${dispute.employer.fullName}) thắng tranh chấp`
                : `Người làm (${dispute.freelancer.fullName}) thắng tranh chấp`
              }
            </p>
            {dispute.adminNote && (
              <p className="text-sm text-purple-600 mt-2">Lý do: {dispute.adminNote}</p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Tiến độ voting</h4>
            <div className="flex gap-2">
              {[1, 2, 3].map((r) => {
                const winnerWallet = r === 1 ? dispute.round1WinnerWallet :
                                    r === 2 ? dispute.round2WinnerWallet :
                                    dispute.round3WinnerWallet;
                const isCompleted = !!winnerWallet;
                const isCurrent = r === dispute.currentRound && !winnerWallet;
                const isEmployerWin = winnerWallet === dispute.employer.walletAddress;
                
                return (
                  <div
                    key={r}
                    className={`flex-1 p-2 rounded text-center ${
                      isCompleted
                        ? isEmployerWin
                          ? "bg-blue-100 border border-blue-200"
                          : "bg-green-100 border border-green-200"
                        : isCurrent
                          ? "bg-orange-100 border border-orange-200"
                          : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-700">Round {r}</p>
                    <p className={`text-xs mt-0.5 ${
                      isCompleted
                        ? isEmployerWin
                          ? "text-blue-600"
                          : "text-green-600"
                        : isCurrent
                          ? "text-orange-600"
                          : "text-gray-400"
                    }`}>
                      {isCompleted
                        ? isEmployerWin
                          ? "Bên thuê"
                          : "Người làm"
                        : isCurrent
                          ? "Đang vote"
                          : "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {!isConnected && !alreadySigned && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="warning" size={18} className="text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Cần kết nối ví để ký xác nhận
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={connect}
                  disabled={isConnecting}
                  className="bg-[#00b14f] hover:bg-[#009643]"
                >
                  {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                </Button>
              </div>
            </div>
          )}

          {alreadySigned && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="check_circle" size={18} className="text-green-600" />
                <span className="text-sm text-green-800">
                  Bạn đã ký xác nhận với vai trò {roleLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Đóng
          </Button>
          {!alreadySigned && (
            <Button 
              onClick={handleSign} 
              disabled={isSubmitting || !isConnected}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang ký...
                </>
              ) : (
                <>
                  <Icon name="verified" size={16} />
                  Ký xác nhận
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
