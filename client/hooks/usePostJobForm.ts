import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export type TimeUnit = "minutes" | "days";

export interface FormData {
  title: string;
  description: string;
  context: string;
  requirements: string;
  deliverables: string;
  skills: string[];
  budget: number;
  currency: string;
  applicationDeadlineValue: number;
  applicationDeadlineUnit: TimeUnit;
  submissionValue: number;
  submissionUnit: TimeUnit;
  reviewValue: number;
  reviewUnit: TimeUnit;
}

function toMinutes(value: number, unit: TimeUnit): number {
  return unit === "days" ? value * 24 * 60 : value;
}

export interface ContractTerm {
  title: string;
  content: string;
}

const PLATFORM_FEE_PERCENT = 5;

import { generateContractHash } from "@/lib/contractHash";

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function usePostJobForm(onSuccess?: () => void) {
  const { isConnected, address,  connect, taoKyQuy } = useWallet();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "processing">("form");

  const [formData, setFormData] = useState<FormData>(() => ({
    title: "Thiết kế website bán hàng responsive",
    description: "Cần thiết kế website bán hàng với giao diện hiện đại, responsive trên mọi thiết bị. Website cần có các trang: Trang chủ, Sản phẩm, Chi tiết sản phẩm, Giỏ hàng, Thanh toán, Liên hệ.",
    context: "Dự án cho cửa hàng thời trang online, phục vụ khách hàng trẻ từ 18-35 tuổi.",
    requirements: "- Có kinh nghiệm với React/Next.js\n- Biết sử dụng Tailwind CSS\n- Có portfolio về website thương mại điện tử",
    deliverables: "- Source code hoàn chỉnh\n- File thiết kế Figma\n- Hướng dẫn cài đặt",
    skills: ["React", "Next.js", "Tailwind CSS", "Figma"],
    budget: 0.1,
    currency: "APT",
    applicationDeadlineValue: 2,
    applicationDeadlineUnit: "minutes",
    submissionValue: 2,
    submissionUnit: "minutes",
    reviewValue: 2,
    reviewUnit: "minutes",
  }));

  const escrowAmount = formData.budget * (1 + PLATFORM_FEE_PERCENT / 100);
  const platformFee = formData.budget * (PLATFORM_FEE_PERCENT / 100);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = ["budget", "applicationDeadlineValue", "submissionValue", "reviewValue"];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value ? Number(value) : undefined) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả công việc");
      return false;
    }
    if (!formData.budget || formData.budget < 0.01) {
      toast.error("Ngân sách tối thiểu 0.01 APT");
      return false;
    }
    if (!formData.applicationDeadlineValue || formData.applicationDeadlineValue < 1) {
      toast.error("Hạn nộp hồ sơ tối thiểu 1");
      return false;
    }
    if (!formData.submissionValue || formData.submissionValue < 1) {
      toast.error("Thời gian nộp sản phẩm tối thiểu 1");
      return false;
    }
    if (!formData.reviewValue || formData.reviewValue < 1) {
      toast.error("Thời gian nghiệm thu tối thiểu 1");
      return false;
    }
    return true;
  };

  const handleProceedToConfirm = async () => {
    if (!validateForm()) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng cài đặt và kết nối ví Petra để tiếp tục");
        return;
      }
    }



    setStep("confirm");
  };

  const handleSaveDraft = async (contractTerms: ContractTerm[]) => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả công việc");
      return;
    }

    setIsSubmitting(true);
    try {
      const deadlineMinutes = toMinutes(formData.applicationDeadlineValue, formData.applicationDeadlineUnit);
      const deadlineDate = formData.applicationDeadlineValue
        ? new Date(Date.now() + deadlineMinutes * 60 * 1000)
        : undefined;
      const applicationDeadline = deadlineDate ? formatLocalDateTime(deadlineDate) : undefined;
      const submissionDays = toMinutes(formData.submissionValue, formData.submissionUnit);
      const reviewDays = toMinutes(formData.reviewValue, formData.reviewUnit);
      
      const response = await api.createJob({
        title: formData.title,
        description: formData.description,
        context: formData.context,
        requirements: formData.requirements,
        deliverables: formData.deliverables,
        skills: formData.skills,
        budget: formData.budget,
        currency: formData.currency,
        applicationDeadline,
        submissionDays,
        reviewDays,
        saveAsDraft: true,
      });

      if (response.status === "SUCCESS" && response.data) {
        const validTerms = contractTerms.filter(t => t.title.trim() || t.content.trim());
        const contractData = {
          budget: formData.budget || 0,
          currency: formData.currency || "APT",
          deadlineDays: submissionDays,
          reviewDays,
          requirements: formData.requirements || "",
          deliverables: formData.deliverables || "",
          terms: validTerms,
        };
        await api.createJobContract(response.data.id, contractData);
        toast.success("Đã lưu bản nháp!");
        onSuccess?.();
      } else {
        toast.error(response.message || "Không thể lưu bản nháp");
      }
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (contractTerms: ContractTerm[]) => {
    if (!isConnected || !address) {
      toast.error("Vui lòng kết nối ví");
      return;
    }

    if (!formData.applicationDeadlineValue || formData.applicationDeadlineValue < 1) {
      toast.error("Hạn nộp hồ sơ tối thiểu 1");
      return;
    }

    setStep("processing");
    setIsSubmitting(true);

    const deadlineMinutes = toMinutes(formData.applicationDeadlineValue, formData.applicationDeadlineUnit);
    const submissionMinutes = toMinutes(formData.submissionValue, formData.submissionUnit);
    const reviewMinutes = toMinutes(formData.reviewValue, formData.reviewUnit);

    try {
      const contractData = {
        budget: formData.budget,
        currency: formData.currency || "APT",
        deadlineDays: submissionMinutes,
        reviewDays: reviewMinutes,
        requirements: formData.requirements || "",
        deliverables: formData.deliverables || "",
        terms: contractTerms.filter(t => t.title.trim() || t.content.trim()),
      };

      toast.info("Đang tạo hợp đồng...");
      const contractHash = await generateContractHash(contractData);

      const amountInOcta = Math.floor(formData.budget * 100_000_000);
      const hanUngTuyen = deadlineMinutes * 60;
      const thoiGianLam = submissionMinutes * 60;
      const thoiGianDuyet = reviewMinutes * 60;
      const cid = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const result = await taoKyQuy(cid, contractHash, amountInOcta, hanUngTuyen, thoiGianLam, thoiGianDuyet);
      
      if (!result) {
        throw new Error("Không thể tạo công việc");
      }

      const { txHash, escrowId } = result;
      const deadlineDate = new Date(Date.now() + deadlineMinutes * 60 * 1000);
      const applicationDeadline = formatLocalDateTime(deadlineDate);
      
      try {
        const response = await api.createJob({
          title: formData.title,
          description: formData.description,
          context: formData.context,
          requirements: formData.requirements,
          deliverables: formData.deliverables,
          skills: formData.skills,
          budget: formData.budget,
          currency: formData.currency,
          applicationDeadline,
          submissionDays: submissionMinutes,
          reviewDays: reviewMinutes,
          escrowId,
          walletAddress: address,
          txHash,
        });

        if (response.status === "SUCCESS" && response.data) {
          await api.createJobContract(response.data.id, { ...contractData, contractHash });
          toast.success("Tạo công việc thành công!");
          onSuccess?.();
        } else {
          throw new Error(response.message || "Không thể lưu công việc");
        }
      } catch (dbError: any) {
        toast.error("Lưu DB thất bại, đang hoàn tiền...");
        try {
          await api.cancelEscrow(escrowId);
          toast.info("Đã hoàn tiền escrow");
        } catch (refundError) {
          toast.error("Không thể hoàn tiền tự động. Escrow ID: " + escrowId);
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error("Error creating job:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra");
      }
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    step,
    setStep,
    isSubmitting,
    escrowAmount,
    platformFee,
    handleChange,
    handleProceedToConfirm,
    handleSaveDraft,
    handleSubmit,
    PLATFORM_FEE_PERCENT,
  };
}
