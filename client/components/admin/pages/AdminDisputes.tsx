"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, Dispute, DisputeRound, DISPUTE_STATUS_CONFIG, DISPUTE_ROUND_STATUS_CONFIG } from "@/lib/api";
import { Page } from "@/types/job";
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/ui/pagination";
import AdminLoading from "../shared/AdminLoading";
import AdminPageHeader from "../shared/AdminPageHeader";
import AdminEmptyState from "../shared/AdminEmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/Icon";
import { useWallet } from "@/context/WalletContext";

export default function AdminDisputes() {
  const { isConnected, connect, adminVote: walletAdminVote } = useWallet();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [myPendingVotes, setMyPendingVotes] = useState<DisputeRound[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Dialog states
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [selectedRound, setSelectedRound] = useState<DisputeRound | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [employerWins, setEmployerWins] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDisputes = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await api.adminGetPendingDisputes({ page: pageNum, size: 10 });
      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<Dispute>;
        setDisputes(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.adminCountPendingDisputes();
      if (response.status === "SUCCESS") {
        setPendingCount(response.data);
      }
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

  const fetchMyPendingVotes = async () => {
    try {
      const response = await api.adminGetMyPendingVotes();
      if (response.status === "SUCCESS" && response.data) {
        setMyPendingVotes(response.data);
      }
    } catch (error) {
      console.error("Error fetching my pending votes:", error);
    }
  };

  useEffect(() => {
    fetchDisputes(page);
    fetchPendingCount();
    fetchMyPendingVotes();
  }, [page]);

  const handleViewDetail = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDetailDialogOpen(true);
  };

  const openVoteDialog = (round: DisputeRound) => {
    setSelectedRound(round);
    setEmployerWins(null);
    setVoteDialogOpen(true);
  };

  const handleSubmitVote = async () => {
    if (!selectedRound || employerWins === null) {
      toast.error("Vui lòng chọn bên thắng");
      return;
    }

    if (!isConnected) {
      toast.error("Vui lòng kết nối ví trước");
      connect();
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Sign blockchain transaction first
      toast.info("Đang ký giao dịch blockchain...");
      const blockchainDisputeId = selectedRound.blockchainDisputeId || selectedRound.disputeId;
      const txHash = await walletAdminVote(blockchainDisputeId, employerWins);
      
      if (!txHash) {
        toast.error("Ký giao dịch thất bại hoặc bị hủy");
        return;
      }

      toast.success("Đã ký blockchain thành công!");

      // 2. Then submit to backend with txHash
      const response = await api.adminSubmitVote(
        selectedRound.disputeId,
        selectedRound.roundNumber,
        employerWins,
        txHash
      );
      if (response.status === "SUCCESS") {
        toast.success(`Đã vote Round ${selectedRound.roundNumber}. ${employerWins ? "Bên thuê" : "Người làm"} thắng.`);
        setVoteDialogOpen(false);
        setSelectedRound(null);
        setEmployerWins(null);
        fetchDisputes(page);
        fetchPendingCount();
        fetchMyPendingVotes();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("Có lỗi xảy ra khi vote");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Da het han";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `Con ${days} ngay ${hours % 24}h`;
    }
    return `Con ${hours}h ${minutes}m`;
  };

  if (isLoading && disputes.length === 0) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quan ly khieu nai"
        totalElements={totalElements}
        badge={pendingCount > 0 ? { count: pendingCount, label: "dang cho" } : undefined}
      />

      {/* My Pending Votes Section */}
      {myPendingVotes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Tranh chấp cần bạn vote ({myPendingVotes.length})
          </h3>
          <div className="space-y-3">
            {myPendingVotes.map((round) => (
              <div
                key={round.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {round.jobTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Round {round.roundNumber} - Dispute #{round.disputeId}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>Ben thue: {round.employerName}</span>
                      <span>Nguoi lam: {round.freelancerName}</span>
                    </div>
                    {round.voteDeadline && (
                      <p className="text-xs text-orange-600 mt-1">
                        {getTimeRemaining(round.voteDeadline)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openVoteDialog(round)}
                    className="bg-[#00b14f] hover:bg-[#009643] text-white shrink-0"
                  >
                    Vote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {disputes.length === 0 ? (
        <AdminEmptyState message="Khong co khieu nai nao dang cho xu ly" />
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">{dispute.jobTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">#{dispute.id} - Job #{dispute.jobId}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    DISPUTE_STATUS_CONFIG[dispute.status]?.color || "text-gray-600"
                  } bg-gray-100`}>
                    {dispute.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Ben thue</p>
                    <p className="font-medium text-gray-900 truncate">{dispute.employer.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Nguoi lam</p>
                    <p className="font-medium text-gray-900 truncate">{dispute.freelancer.fullName}</p>
                  </div>
                </div>

                {/* Voting Progress */}
                {dispute.currentRound !== undefined && dispute.currentRound > 0 && (
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-600 mb-1">Tien do voting:</p>
                    <div className="flex gap-1">
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
                            className={`flex-1 h-6 rounded flex items-center justify-center text-xs font-medium ${
                              isCompleted
                                ? isEmployerWin
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                                : isCurrent
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            R{r}
                            {isCompleted && (isEmployerWin ? " (E)" : " (F)")}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {dispute.evidenceDeadline && dispute.status === "PENDING_FREELANCER_RESPONSE" && (
                  <p className="text-xs text-gray-500">
                    Han nop bang chung: {formatDateTime(dispute.evidenceDeadline)}
                  </p>
                )}

                <p className="text-xs text-gray-500">{formatDateTime(dispute.createdAt)}</p>

                <div className="pt-2 border-t">
                  <button
                    onClick={() => handleViewDetail(dispute)}
                    className="text-gray-600 hover:underline text-sm"
                  >
                    Xem chi tiet
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cong viec</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ben thue</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nguoi lam</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Voting</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngay tao</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{dispute.jobTitle}</p>
                        <p className="text-xs text-gray-500">#{dispute.id}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{dispute.employer.fullName}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{dispute.freelancer.fullName}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${
                          DISPUTE_STATUS_CONFIG[dispute.status]?.color || "text-gray-600"
                        }`}>
                          {dispute.statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {dispute.currentRound !== undefined && dispute.currentRound > 0 ? (
                          <div className="flex gap-0.5 justify-center">
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
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                                    isCompleted
                                      ? isEmployerWin
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-green-100 text-green-700"
                                      : isCurrent
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-gray-100 text-gray-400"
                                  }`}
                                  title={
                                    isCompleted
                                      ? `Round ${r}: ${isEmployerWin ? "Employer" : "Freelancer"}`
                                      : isCurrent
                                        ? `Round ${r}: Dang vote`
                                        : `Round ${r}`
                                  }
                                >
                                  {r}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">
                        {formatDateTime(dispute.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleViewDetail(dispute)}
                          className="text-gray-600 hover:underline text-sm"
                        >
                          Chi tiet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
          <DialogHeader>
            <DialogTitle>Chi tiet khieu nai #{selectedDispute?.id}</DialogTitle>
            <DialogDescription>
              Cong viec: {selectedDispute?.jobTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Trang thai:</span>
                <span className={`px-2 py-1 rounded-full text-xs bg-gray-100 ${
                  DISPUTE_STATUS_CONFIG[selectedDispute.status]?.color || "text-gray-600"
                }`}>
                  {selectedDispute.statusLabel}
                </span>
              </div>

              {/* Voting Progress */}
              {selectedDispute.currentRound !== undefined && selectedDispute.currentRound > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Tien do voting</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((r) => {
                      const winnerWallet = r === 1 ? selectedDispute.round1WinnerWallet :
                                          r === 2 ? selectedDispute.round2WinnerWallet :
                                          selectedDispute.round3WinnerWallet;
                      const isCompleted = !!winnerWallet;
                      const isCurrent = r === selectedDispute.currentRound && !winnerWallet;
                      const isEmployerWin = winnerWallet === selectedDispute.employer.walletAddress;
                      
                      return (
                        <div
                          key={r}
                          className={`flex items-center justify-between p-2 rounded ${
                            isCompleted
                              ? "bg-green-50 border border-green-200"
                              : isCurrent
                                ? "bg-orange-50 border border-orange-200"
                                : "bg-gray-100"
                          }`}
                        >
                          <span className="text-sm font-medium">Round {r}</span>
                          <span className={`text-sm ${
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
                                ? "Ben thue thang"
                                : "Nguoi lam thang"
                              : isCurrent
                                ? "Dang cho vote"
                                : "Chua bat dau"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Final Result */}
                  {selectedDispute.finalWinnerWallet && (
                    <div className="mt-3 p-3 bg-[#00b14f]/10 border border-[#00b14f]/30 rounded-lg">
                      <p className="text-sm font-medium text-[#00b14f]">
                        Ket qua cuoi cung:{" "}
                        {selectedDispute.finalWinnerWallet === selectedDispute.employer.walletAddress
                          ? `Ben thue (${selectedDispute.employer.fullName}) thang`
                          : `Nguoi lam (${selectedDispute.freelancer.fullName}) thang`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Ben thue khieu nai */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">
                  Khieu nai tu ben thue: {selectedDispute.employer.fullName}
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedDispute.employerDescription}</p>
                {selectedDispute.employerEvidenceUrl && (
                  <a
                    href={selectedDispute.employerEvidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-2 mt-3 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">Bang chung dinh kem</span>
                    <Icon name="download" size={18} className="text-gray-500 shrink-0" />
                  </a>
                )}
              </div>

              {/* Nguoi lam phan hoi */}
              {selectedDispute.freelancerDescription ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Phan hoi tu nguoi lam: {selectedDispute.freelancer.fullName}
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedDispute.freelancerDescription}</p>
                  {selectedDispute.freelancerEvidenceUrl && (
                    <a
                      href={selectedDispute.freelancerEvidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2 mt-3 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
                      <span className="flex-1 text-sm text-gray-700">Bang chung dinh kem</span>
                      <Icon name="download" size={18} className="text-gray-500 shrink-0" />
                    </a>
                  )}
                </div>
              ) : selectedDispute.evidenceDeadline ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-1">
                    Cho nguoi lam phan hoi
                  </h4>
                  <p className="text-sm text-gray-600">
                    Han: {formatDateTime(selectedDispute.evidenceDeadline)}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Nguoi lam chua gui bang chung
                  </p>
                </div>
              )}

              {/* Admin note */}
              {selectedDispute.adminNote && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Ghi chu
                  </h4>
                  <p className="text-sm text-gray-600">{selectedDispute.adminNote}</p>
                  {selectedDispute.resolvedBy && (
                    <p className="text-xs text-gray-500 mt-2">
                      Nguoi xu ly: {selectedDispute.resolvedBy.fullName} - {formatDateTime(selectedDispute.resolvedAt!)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vote Dialog */}
      <Dialog open={voteDialogOpen} onOpenChange={setVoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vote Round {selectedRound?.roundNumber}</DialogTitle>
            <DialogDescription>
              {selectedRound?.jobTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedRound && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Ben thue:</span>
                  <span className="font-medium">{selectedRound.employerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nguoi lam:</span>
                  <span className="font-medium">{selectedRound.freelancerName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chon ben thang
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEmployerWins(true)}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      employerWins === true 
                        ? "border-[#00b14f] bg-[#00b14f]/10 text-[#00b14f]" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm">Ben thue</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{selectedRound.employerName}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployerWins(false)}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      employerWins === false 
                        ? "border-[#00b14f] bg-[#00b14f]/10 text-[#00b14f]" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm">Nguoi lam</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{selectedRound.freelancerName}</p>
                  </button>
                </div>
              </div>

              {selectedRound.voteDeadline && (
                <div className="text-xs text-gray-500 text-center">
                  Han vote: {formatDateTime(selectedRound.voteDeadline)}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoteDialogOpen(false)} disabled={isProcessing}>
              Huy
            </Button>
            <Button 
              onClick={handleSubmitVote} 
              disabled={isProcessing || employerWins === null}
              className="bg-[#00b14f] hover:bg-[#009643]"
            >
              {isProcessing ? "Dang xu ly..." : "Xac nhan vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
