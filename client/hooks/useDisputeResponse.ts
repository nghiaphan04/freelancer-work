import { useState } from "react";
import { toast } from "sonner";
import { api, Dispute } from "@/lib/api";

export type EvidenceMeta = {
  url: string;
  fileId?: number;
  name?: string;
  size?: number;
};

export function useDisputeResponse(
  dispute: Dispute,
  onSuccess?: () => void,
  onClose?: () => void
) {
  const [description, setDescription] = useState("Tôi phản đối khiếu nại này vì:\n\n1. Sản phẩm đã được giao đúng theo yêu cầu trong hợp đồng\n2. Tất cả chức năng đã được demo và xác nhận\n3. Có email xác nhận từ bên thuê về các thay đổi yêu cầu");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceMeta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRespond = dispute.status === "PENDING_FREELANCER_RESPONSE" && 
    (!dispute.evidenceDeadline || new Date(dispute.evidenceDeadline) > new Date());

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    if (!selectedEvidence?.url?.trim()) {
      toast.error("Vui lòng upload file bằng chứng (PDF)");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitDisputeResponse(
        dispute.id,
        description,
        selectedEvidence?.url ?? "",
        selectedEvidence?.fileId
      );
      if (response.status === "SUCCESS") {
        toast.success("Da gui phan hoi thanh cong. Qua trinh voting se bat dau.");
        setDescription("");
        setSelectedEvidence(null);
        onClose?.();
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi phản hồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    description,
    setDescription,
    selectedEvidence,
    setSelectedEvidence,
    isSubmitting,
    canRespond,
    handleSubmit,
  };
}
