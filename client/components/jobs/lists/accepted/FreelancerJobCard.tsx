"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Job, JOB_STATUS_CONFIG, WorkStatus } from "@/types/job";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WalletAvatar from "@/components/ui/WalletAvatar";
import SystemTermsDisplay from "@/components/jobs/forms/post-job/sections/SystemTermsDisplay";

const WORK_STATUS_CONFIG: Record<WorkStatus, { label: string; color: string; icon: string }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", color: "bg-gray-100 text-gray-600", icon: "hourglass_empty" },
  IN_PROGRESS: { label: "Đang làm", color: "bg-gray-100 text-gray-600", icon: "pending" },
  SUBMITTED: { label: "Đã nộp - Chờ duyệt", color: "bg-gray-100 text-gray-600", icon: "upload_file" },
  REVISION_REQUESTED: { label: "Cần chỉnh sửa", color: "bg-gray-100 text-gray-600", icon: "edit_note" },
  APPROVED: { label: "Đã duyệt", color: "bg-gray-100 text-gray-600", icon: "check_circle" },
};

const PLATFORM_FEE_PERCENT = 5;

interface FreelancerJobCardProps {
  job: Job;
  onSubmitWork?: (job: { id: number; title: string; escrowId?: number }) => void;
  onViewDispute?: (jobId: number) => void;
  onRequestWithdraw?: (job: { id: number; title: string; escrowId?: number }) => void;
  onSignSuccess?: () => void;
}

export default function FreelancerJobCard({ job, onSubmitWork, onViewDispute, onRequestWithdraw, onSignSuccess }: FreelancerJobCardProps) {
  const { isConnected, kyHopDong, tuChoiHopDong, connect, isConnecting } = useWallet();
  const { user } = useAuth();
  const [contractExpanded, setContractExpanded] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [submissionCountdown, setSubmissionCountdown] = useState<string>("");
  const [reviewCountdown, setReviewCountdown] = useState<string>("");
  const [disputeCountdown, setDisputeCountdown] = useState<string>("");

  const hasSubmittedWork = job.workStatus === "SUBMITTED";
  const needsRevision = job.workStatus === "REVISION_REQUESTED";
  const isApprovedWork = job.workStatus === "APPROVED";
  const effectiveWorkStatus = job.workStatus || (job.workSubmissionUrl ? "SUBMITTED" : undefined);
  const workConfig = effectiveWorkStatus ? WORK_STATUS_CONFIG[effectiveWorkStatus] : undefined;
  const isPendingSignature = job.status === "PENDING_SIGNATURE";
  const isInProgress = job.status === "IN_PROGRESS";
  const isDisputed = job.status === "DISPUTED";
  const needsDisputeResponse = isDisputed && 
    job.disputeInfo?.status === "PENDING_FREELANCER_RESPONSE" && 
    !job.disputeInfo?.hasFreelancerEvidence;

  // Helper function to format countdown
  const formatCountdown = (diff: number): string => {
    if (diff <= 0) return "Đã hết hạn";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Countdown timer for signing deadline
  useEffect(() => {
    if (!isPendingSignature || !job.signDeadline) return;

    const updateCountdown = () => {
      const deadline = new Date(job.signDeadline!).getTime();
      const diff = deadline - Date.now();
      setCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isPendingSignature, job.signDeadline]);

  // Countdown timer for submission deadline
  useEffect(() => {
    if (!isInProgress || !job.workSubmissionDeadline || hasSubmittedWork) {
      setSubmissionCountdown("");
      return;
    }

    const updateCountdown = () => {
      const deadline = new Date(job.workSubmissionDeadline!).getTime();
      const diff = deadline - Date.now();
      setSubmissionCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isInProgress, job.workSubmissionDeadline, hasSubmittedWork]);

  // Countdown timer for review deadline (when work is submitted)
  useEffect(() => {
    if (!isInProgress || !job.workReviewDeadline || !hasSubmittedWork) {
      setReviewCountdown("");
      return;
    }

    const updateCountdown = () => {
      const deadline = new Date(job.workReviewDeadline!).getTime();
      const diff = deadline - Date.now();
      setReviewCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isInProgress, job.workReviewDeadline, hasSubmittedWork]);

  // Countdown timer for dispute evidence deadline
  useEffect(() => {
    if (!needsDisputeResponse || !job.disputeInfo?.evidenceDeadline) {
      setDisputeCountdown("");
      return;
    }

    const updateCountdown = () => {
      const deadline = new Date(job.disputeInfo!.evidenceDeadline!).getTime();
      const diff = deadline - Date.now();
      setDisputeCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [needsDisputeResponse, job.disputeInfo?.evidenceDeadline]);

  const displayBudget = job.budget ? `${job.budget.toLocaleString("vi-VN")} ${job.currency}` : "Thương lượng";

  // Fetch contract when expanded
  useEffect(() => {
    if (isPendingSignature && contractExpanded && !contractData && !isLoadingContract) {
      fetchContract();
    }
  }, [isPendingSignature, contractExpanded]);

  const fetchContract = async () => {
    setIsLoadingContract(true);
    try {
      const response = await api.getJobContract(job.id);
      if (response.status === "SUCCESS" && response.data) {
        setContractData(response.data);
      }
    } catch (error) {
      console.error("Error fetching contract:", error);
    } finally {
      setIsLoadingContract(false);
    }
  };

  const handleSign = async () => {
    if (!contractData) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để ký hợp đồng");
        return;
      }
    }

    if (!job.escrowId) {
      toast.error("Không tìm thấy thông tin escrow");
      return;
    }

    setIsSigning(true);
    try {
      const txHash = await kyHopDong(job.escrowId, contractData.contractHash);
      
      if (!txHash) {
        throw new Error("Không thể ký hợp đồng");
      }

      const response = await api.signJobContract(job.id, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Bạn đã ký hợp đồng và có thể bắt đầu làm việc!");
        onSignSuccess?.();
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
      setIsSigning(false);
    }
  };

  const handleReject = async () => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví");
        return;
      }
    }

    if (!job.escrowId) {
      toast.error("Không tìm thấy thông tin escrow");
      return;
    }

    setIsRejecting(true);
    try {
      const txHash = await tuChoiHopDong(job.escrowId);
      
      if (!txHash) {
        throw new Error("Không thể từ chối hợp đồng");
      }

      const response = await api.rejectContract(job.id, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Đã từ chối hợp đồng");
        onSignSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error rejecting contract:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi từ chối hợp đồng");
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const validTerms = contractData?.terms?.filter((t: any) => t.title?.trim() || t.content?.trim()) || [];

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {job.employer && (
          job.employer.avatarUrl ? (
            <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
              <AvatarImage src={job.employer.avatarUrl} alt={job.employer.fullName} />
              <AvatarFallback className="bg-[#00b14f] text-white">
                {job.employer.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : job.employer.walletAddress ? (
            <WalletAvatar address={job.employer.walletAddress} size={48} className="shrink-0 hidden sm:flex" />
          ) : (
            <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
              <AvatarFallback className="bg-[#00b14f] text-white">
                {job.employer.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer truncate">
              {job.title}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                JOB_STATUS_CONFIG[job.status]?.color || "bg-gray-100 text-gray-700"
              }`}
            >
              {JOB_STATUS_CONFIG[job.status]?.label || job.status}
            </span>
          </div>

          {job.employer && <p className="text-sm text-gray-600 mb-2">{job.employer.fullName}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Icon name="payments" size={16} />
              {displayBudget}
            </span>
            {job.applicationDeadline && (
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={16} />
                Hạn: {new Date(job.applicationDeadline).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          {job.status === "IN_PROGRESS" && workConfig && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm mb-2 ${
                workConfig.color || "bg-gray-100 text-gray-600"
              }`}
            >
              <Icon name={workConfig.icon || "info"} size={16} />
              <span className="font-medium">{workConfig.label}</span>
            </div>
          )}

          {job.status === "IN_PROGRESS" && job.workSubmissionDeadline && !hasSubmittedWork && (
            <div className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg mb-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="timer" size={16} />
                <span>Hạn nộp sản phẩm: {new Date(job.workSubmissionDeadline).toLocaleDateString("vi-VN")}</span>
              </div>
              {submissionCountdown && (
                <span className={`font-medium ${submissionCountdown === "Đã hết hạn" ? "text-gray-700" : "text-green-600"}`}>
                  {submissionCountdown === "Đã hết hạn" ? submissionCountdown : `Còn ${submissionCountdown}`}
                </span>
              )}
            </div>
          )}

          {job.status === "IN_PROGRESS" && job.workReviewDeadline && hasSubmittedWork && (
            <div className="flex items-center justify-between text-sm bg-green-50 px-3 py-2 rounded-lg mb-2">
              <div className="flex items-center gap-2 text-green-700">
                <Icon name="hourglass_top" size={16} />
                <span>Chờ duyệt - quá hạn tự động nhận tiền</span>
              </div>
              {reviewCountdown && (
                <span className={`font-medium ${reviewCountdown === "Đã hết hạn" ? "text-gray-700" : "text-green-600"}`}>
                  {reviewCountdown === "Đã hết hạn" ? reviewCountdown : `Còn ${reviewCountdown}`}
                </span>
              )}
            </div>
          )}

          {job.status === "DISPUTED" && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-2 ${
              needsDisputeResponse 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : "bg-gray-100 text-gray-700"
            }`}>
              <Icon name={needsDisputeResponse ? "warning" : "gavel"} size={16} />
              {needsDisputeResponse ? (
                <div className="flex-1">
                  <span className="font-medium">BAN CAN GUI BANG CHUNG PHAN HOI!</span>
                  {disputeCountdown && (
                    <span className="ml-2 font-bold">
                      {disputeCountdown === "Đã hết hạn" ? "(HẾT HẠN)" : `(Còn ${disputeCountdown})`}
                    </span>
                  )}
                </div>
              ) : job.disputeInfo?.status?.includes("VOTING") ? (
                <span>Đang vote Round {job.disputeInfo?.currentRound || 1} - Chờ trọng tài viên quyết định</span>
              ) : (
                <span>Tranh chấp đã được giải quyết</span>
              )}
            </div>
          )}

          {job.workSubmissionUrl && (
            <a
              href={job.workSubmissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors mb-2"
            >
              <Icon name="picture_as_pdf" size={20} className="text-gray-600 shrink-0" />
              <span className="flex-1 text-sm text-gray-700 truncate">Sản phẩm đã nộp</span>
              <Icon name="download" size={18} className="text-gray-500 shrink-0" />
            </a>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          <Link href={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <Icon name="visibility" size={16} />
              <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
            </Button>
          </Link>
          {job.status === "IN_PROGRESS" && !isApprovedWork && (
            hasSubmittedWork && !needsRevision ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <Icon name="hourglass_top" size={16} />
                <span className="sm:hidden lg:inline ml-1">Chờ duyệt</span>
              </Button>
            ) : (
              <Button
                size="sm"
                className={needsRevision ? "bg-gray-600 hover:bg-gray-700" : "bg-[#00b14f] hover:bg-[#009643]"}
                onClick={() => onSubmitWork?.({ id: job.id, title: job.title, escrowId: job.escrowId })}
              >
                <Icon name={needsRevision ? "edit_note" : "upload"} size={16} />
                <span className="sm:hidden lg:inline ml-1">
                  {needsRevision ? "Nộp lại" : "Nộp bài"}
                </span>
              </Button>
            )
          )}
          {job.status === "IN_PROGRESS" && !hasSubmittedWork && !needsRevision && onRequestWithdraw && (
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-100"
              onClick={() => onRequestWithdraw({ id: job.id, title: job.title, escrowId: job.escrowId })}
            >
              <Icon name="exit_to_app" size={16} />
              <span className="sm:hidden lg:inline ml-1">Xin rút</span>
            </Button>
          )}
          {job.status === "DISPUTED" && (
            <Button
              size="sm"
              variant={needsDisputeResponse ? "default" : "outline"}
              className={needsDisputeResponse 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : ""
              }
              onClick={() => onViewDispute?.(job.id)}
            >
              <Icon name={needsDisputeResponse ? "warning" : "gavel"} size={16} />
              <span className="sm:hidden lg:inline ml-1">
                {needsDisputeResponse ? "Gửi phản hồi" : "Tranh chấp"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Contract Section - Only for PENDING_SIGNATURE */}
      {isPendingSignature && (
        <div className="border-t border-gray-100 mt-4">
          {/* Contract Header - Toggle */}
          <button
            onClick={() => setContractExpanded(!contractExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Hợp đồng công việc</p>
            <Icon 
              name={contractExpanded ? "expand_less" : "expand_more"} 
              size={22} 
              className="text-gray-400"
            />
          </button>

          {/* Contract Content - Expandable */}
          {contractExpanded && (
            <div className="px-4 pb-4">
              {isLoadingContract ? (
                <div className="py-6 text-center">
                  <div className="w-6 h-6 border-2 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Đang tải hợp đồng...</p>
                </div>
              ) : contractData ? (
                <>
                  <div className="border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="px-4 py-2 border-b border-gray-200 text-center">
                      <p className="text-xs font-medium uppercase text-gray-600">Xác thực trên Blockchain Aptos</p>
                    </div>
                    
                    <div className="px-4 py-3 max-h-[500px] overflow-y-auto text-sm leading-relaxed scrollbar-thin">
                      {/* Thông tin các bên */}
                      <div className="mb-4 space-y-3">
                        <p className="text-center font-semibold text-gray-800 uppercase text-xs tracking-wide">
                          Thông tin các bên
                        </p>
                        <div className="space-y-1 text-gray-700">
                          <p className="font-semibold">
                            Bên A – Bên thuê
                            {job.employer?.fullName ? `: ${job.employer.fullName}` : ""}
                          </p>
                          {job.employer?.walletAddress && (
                            <p>Địa chỉ ví: {job.employer.walletAddress}</p>
                          )}
                        </div>
                        <div className="space-y-1 text-gray-700">
                          <p className="font-semibold">
                            Bên B – Người làm
                            {user?.fullName ? `: ${user.fullName}` : ""}
                          </p>
                          {user?.walletAddress && (
                            <p>Địa chỉ ví: {user.walletAddress}</p>
                          )}
                        </div>
                        <p className="text-justify text-gray-700">
                          Hai bên thống nhất sử dụng hợp đồng điện tử này để ghi nhận việc Bên B thực hiện công việc cho Bên A theo nội
                          dung mô tả công việc đã đăng và các điều khoản chi tiết tại Phần A (Điều khoản công việc) và Phần B (Quy định
                          hệ thống) dưới đây.
                        </p>
                      </div>

                      {/* PHẦN A */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-center text-gray-800 mb-3 pb-1.5 border-b border-gray-300 text-xs uppercase">
                          Phần A - Điều khoản công việc
                        </h4>
                        {validTerms.length > 0 ? (
                          validTerms.map((term: any, index: number) => (
                            <div key={index} className="mb-3">
                              <p className="text-justify text-gray-700">
                                <span className="font-medium text-gray-900">
                                  Điều {index + 1}. {term.title}
                                </span>
                              </p>
                              {term.content && (
                                <div
                                  className="prose prose-sm max-w-none text-gray-700 mt-1"
                                  dangerouslySetInnerHTML={{ __html: term.content }}
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-center italic text-xs">Không có điều khoản tùy chỉnh</p>
                        )}
                      </div>

                      {/* PHẦN B */}
                      <div>
                        <h4 className="font-semibold text-center text-gray-800 mb-3 pb-1.5 border-b border-gray-300 text-xs uppercase">
                          Phần B - Quy định hệ thống
                        </h4>
                        <p className="text-xs text-gray-400 italic mb-2 text-center">
                          (Smart Contract trên Aptos - Không thể thay đổi)
                        </p>
                        <SystemTermsDisplay
                          budget={contractData.budget}
                          submissionDays={contractData.deadlineDays}
                          reviewDays={contractData.reviewDays}
                          platformFeePercent={PLATFORM_FEE_PERCENT}
                          startIndex={validTerms.length}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sign Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    {!isConnected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={connect}
                        disabled={isConnecting}
                      >
                        <Icon name="account_balance_wallet" size={16} />
                        {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReject}
                      disabled={isRejecting || isSigning || !isConnected}
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      {isRejecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                          Đang từ chối...
                        </>
                      ) : (
                        <>
                          <Icon name="close" size={16} />
                          Từ chối
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSign}
                      disabled={isSigning || isRejecting || !isConnected}
                      className="flex-1 bg-[#00b14f] hover:bg-[#009643]"
                    >
                      {isSigning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                          Đang ký...
                        </>
                      ) : (
                        <>
                          <Icon name="draw" size={16} />
                          {isConnected ? "Ký hợp đồng" : "Kết nối ví để ký"}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-center">
                    {countdown && countdown !== "Đã hết hạn" ? (
                      <span className="text-green-600 font-medium">
                        Còn {countdown} để ký hoặc từ chối
                      </span>
                    ) : countdown === "Đã hết hạn" ? (
                      <span className="text-gray-700 font-medium">
                        Đã hết hạn ký hợp đồng
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Bạn có 1p30s kể từ khi được duyệt để ký hoặc từ chối
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <div className="py-4 text-center text-sm text-gray-500">
                  Không thể tải hợp đồng
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
