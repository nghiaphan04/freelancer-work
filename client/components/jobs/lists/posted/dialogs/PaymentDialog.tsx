"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Job } from "@/types/job";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { generateContractHash } from "@/lib/contractHash";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PLATFORM_FEE_PERCENT = 5;

interface PaymentDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export default function PaymentDialog({
  job,
  isOpen,
  onClose,
  onSuccess,
}: PaymentDialogProps) {
  const { isConnected, address, connect, isConnecting, taoKyQuy } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayment = async () => {
    if (!job) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để thanh toán");
        return;
      }
    }

    if (!job.budget || job.budget <= 0) {
      toast.error("Công việc cần có ngân sách để công khai");
      return;
    }

    if (!address) {
      toast.error("Không tìm thấy địa chỉ ví");
      return;
    }

    setIsSubmitting(true);
    try {
      toast.info("Đang tạo hợp đồng...");

      let contractResponse;
      try {
        contractResponse = await api.getJobContract(job.id);
      } catch {
        contractResponse = null;
      }

      const terms = contractResponse?.data?.terms || [];
      const contractData = {
        budget: job.budget,
        currency: "APT",
        deadlineDays: job.submissionDays || 7,
        reviewDays: job.reviewDays || 3,
        requirements: job.requirements || "",
        deliverables: job.deliverables || "",
        terms,
      };

      const contractHash = await generateContractHash(contractData);
      const amountInOcta = Math.floor(job.budget * 100_000_000);
      const hanUngTuyen = 14 * 24 * 60 * 60;
      const thoiGianLam = (job.submissionDays || 7) * 24 * 60 * 60;
      const thoiGianDuyet = (job.reviewDays || 3) * 24 * 60 * 60;
      const cid = `job_${job.id}_payment_${Date.now()}`;

      const result = await taoKyQuy(cid, contractHash, amountInOcta, hanUngTuyen, thoiGianLam, thoiGianDuyet);
      if (!result) {
        throw new Error("Không thể tạo hợp đồng");
      }

      const response = await api.updateJob(job.id, {
        escrowId: result.escrowId,
        walletAddress: address,
        txHash: result.txHash,
        status: "OPEN",
        budget: job.budget,
        requirements: job.requirements,
        deliverables: job.deliverables,
        submissionDays: job.submissionDays,
        reviewDays: job.reviewDays,
        terms,
        contractHash,  // Gửi hash để backend lưu đúng hash trên blockchain
      });

      if (response.status === "SUCCESS") {
        toast.success("Đã thanh toán và công khai công việc!");
        onClose();
        await onSuccess();
      } else {
        toast.error(response.message || "Không thể công khai");
      }
    } catch (error: any) {
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  const escrowAmount = job.budget ? job.budget * (1 + PLATFORM_FEE_PERCENT / 100) : 0;
  const platformFee = job.budget ? job.budget * (PLATFORM_FEE_PERCENT / 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán & Công khai</DialogTitle>
          <DialogDescription>
            #{job.id} - {job.title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-800 mb-3">Chi tiết thanh toán</p>
            <div className="text-sm text-green-700 space-y-2">
              <div className="flex justify-between">
                <span>Ngân sách:</span>
                <span className="font-medium">{job.budget?.toFixed(4)} APT</span>
              </div>
              <div className="flex justify-between">
                <span>Phí nền tảng ({PLATFORM_FEE_PERCENT}%):</span>
                <span className="font-medium">{platformFee.toFixed(4)} APT</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-300">
                <span className="font-medium">Tổng ký quỹ:</span>
                <span className="font-bold text-lg">{escrowAmount.toFixed(4)} APT</span>
              </div>
            </div>
          </div>

          {!isConnected && (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="w-full bg-[#00b14f] hover:bg-[#009643]"
            >
              {isConnecting ? "Đang kết nối..." : "Kết nối ví để thanh toán"}
            </Button>
          )}

          {isConnected && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Icon name="check_circle" size={16} />
              Ví đã kết nối, sẵn sàng thanh toán
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isSubmitting || !isConnected}
            className="bg-[#00b14f] hover:bg-[#009643]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Icon name="payment" size={16} />
                Xác nhận thanh toán
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
