"use client";

import { Dispute } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import renderEvidenceCard from "@/components/jobs/dispute/renderEvidenceCard";

interface ViewDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute | null;
}

export default function ViewDisputeDialog({
  open,
  onOpenChange,
  dispute,
}: ViewDisputeDialogProps) {
  if (!dispute) return null;

  const isVoting = dispute.status.startsWith("VOTING_ROUND");
  const isResolved = ["EMPLOYER_WON", "FREELANCER_WON", "EMPLOYER_CLAIMED", "FREELANCER_CLAIMED", "EVIDENCE_TIMEOUT"].includes(dispute.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi tiet khieu nai
          </DialogTitle>
          <DialogDescription>
            Cong viec: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trang thai:</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {dispute.statusLabel}
            </span>
          </div>

          {/* Voting Progress */}
          {(isVoting || isResolved) && dispute.currentRound !== undefined && dispute.currentRound > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">Tien do voting</h4>
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
                            ? "Ben thue"
                            : "Nguoi lam"
                          : isCurrent
                            ? "Dang vote"
                            : "-"}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Final Result */}
              {dispute.finalWinnerWallet && (
                <div className="mt-3 p-2 bg-[#00b14f]/10 border border-[#00b14f]/30 rounded text-center">
                  <p className="text-sm font-medium text-[#00b14f]">
                    {dispute.finalWinnerWallet === dispute.employer.walletAddress
                      ? `Ben thue (${dispute.employer.fullName}) thang`
                      : `Nguoi lam (${dispute.freelancer.fullName}) thang`}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">
              Khieu nai tu ben thue: {dispute.employer.fullName}
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.employerDescription}</p>
            {renderEvidenceCard(dispute.employerEvidenceFile, dispute.employerEvidenceUrl, "Bang chung dinh kem")}
          </div>

          {dispute.freelancerDescription ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Phan hoi tu nguoi lam: {dispute.freelancer.fullName}
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.freelancerDescription}</p>
              {renderEvidenceCard(dispute.freelancerEvidenceFile, dispute.freelancerEvidenceUrl, "Bang chung dinh kem")}
            </div>
          ) : dispute.evidenceDeadline ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">
                Cho nguoi lam phan hoi
              </h4>
              <p className="text-sm text-gray-600">
                Han: {formatDateTime(dispute.evidenceDeadline)}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Nguoi lam chua gui bang chung
              </p>
            </div>
          )}

          {dispute.adminNote && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Ghi chu
              </h4>
              <p className="text-sm text-gray-600">{dispute.adminNote}</p>
              {dispute.resolvedBy && (
                <p className="text-xs text-gray-500 mt-2">
                  Nguoi xu ly: {dispute.resolvedBy.fullName} - {formatDateTime(dispute.resolvedAt!)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
