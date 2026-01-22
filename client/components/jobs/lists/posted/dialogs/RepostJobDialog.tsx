"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface RepostJobDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export default function RepostJobDialog({
  job,
  isOpen,
  onClose,
  onSuccess,
}: RepostJobDialogProps) {
  const router = useRouter();
  const { isConnected, address, connect, isConnecting, taoKyQuy } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"choose" | "confirm">("choose");

  const handleEditFirst = () => {
    if (job) {
      onClose();
      router.push(`/jobs/${job.id}/edit`);
    }
  };

  const handleRepostAsDraft = async () => {
    if (!job) return;

    setIsSubmitting(true);
    try {
      const response = await api.repostJob(job.id, { saveAsDraft: true });
      if (response.status === "SUCCESS") {
        toast.success("Đã đăng lại dưới dạng bản nháp");
        onClose();
        await onSuccess();
      } else {
        toast.error(response.message || "Không thể đăng lại");
      }
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepostAndPublish = async () => {
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

    setStep("confirm");
  };

  const handleConfirmPublish = async () => {
    if (!job || !isConnected || !address) return;

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
        budget: job.budget!,
        currency: "APT",
        deadlineDays: job.submissionDays || 7,
        reviewDays: job.reviewDays || 3,
        requirements: job.requirements || "",
        deliverables: job.deliverables || "",
        terms,
      };

      const contractHash = await generateContractHash(contractData);
      const amountInOcta = Math.floor(job.budget! * 100_000_000);
      const hanUngTuyen = 14 * 24 * 60 * 60;
      const thoiGianLam = (job.submissionDays || 7) * 24 * 60 * 60;
      const thoiGianDuyet = (job.reviewDays || 3) * 24 * 60 * 60;
      const cid = `job_${job.id}_repost_${Date.now()}`;

      const result = await taoKyQuy(cid, contractHash, amountInOcta, hanUngTuyen, thoiGianLam, thoiGianDuyet);
      if (!result) {
        throw new Error("Không thể tạo hợp đồng");
      }

      const response = await api.repostJob(job.id, {
        saveAsDraft: false,
        escrowId: result.escrowId,
        walletAddress: address,
        txHash: result.txHash,
        contractHash,  // Gửi hash để backend lưu đúng hash trên blockchain
      });

      if (response.status === "SUCCESS") {
        toast.success("Đã đăng lại công việc thành công!");
        onClose();
        await onSuccess();
      } else {
        toast.error(response.message || "Không thể đăng lại");
      }
    } catch (error: any) {
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra");
      }
    } finally {
      setIsSubmitting(false);
      setStep("choose");
    }
  };

  const handleClose = () => {
    setStep("choose");
    onClose();
  };

  if (!job) return null;

  const escrowAmount = job.budget ? job.budget * 1.05 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng lại công việc</DialogTitle>
          <DialogDescription>
            #{job.id} - {job.title}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" && (
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Bạn muốn làm gì với công việc này?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleEditFirst}
                disabled={isSubmitting}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <Icon name="edit" size={24} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Sửa trước khi đăng</p>
                    <p className="text-sm text-gray-500">Chỉnh sửa nội dung rồi quyết định sau</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleRepostAsDraft}
                disabled={isSubmitting}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <Icon name="save" size={24} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Đăng lại dạng Nháp</p>
                    <p className="text-sm text-gray-500">Không tốn phí, thanh toán sau khi sẵn sàng</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleRepostAndPublish}
                disabled={isSubmitting}
                className="w-full p-4 border border-[#00b14f] rounded-lg hover:bg-[#00b14f]/5 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <Icon name="visibility" size={24} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Thanh toán & Công khai ngay</p>
                    <p className="text-sm text-gray-500">
                      Ký quỹ {escrowAmount.toFixed(4)} APT (bao gồm 5% phí)
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Đang xử lý...</span>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="py-4 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800 mb-2">Xác nhận thanh toán</p>
              <div className="text-sm text-green-700 space-y-1">
                <p>Ngân sách: {job.budget?.toFixed(4)} APT</p>
                <p>Phí nền tảng (5%): {(job.budget! * 0.05).toFixed(4)} APT</p>
                <p className="font-medium pt-1 border-t border-green-300">
                  Tổng ký quỹ: {escrowAmount.toFixed(4)} APT
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
                disabled={isSubmitting}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleConfirmPublish}
                disabled={isSubmitting}
                className="bg-[#00b14f] hover:bg-[#009643]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={16} />
                    Xác nhận thanh toán
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "choose" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Đóng
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
