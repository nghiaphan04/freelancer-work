"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  UpdateJobRequest,
  Job,
  JobComplexity,
  JobDuration,
  WorkType,
  JOB_COMPLEXITY_CONFIG,
  JOB_DURATION_CONFIG,
  WORK_TYPE_CONFIG,
  JOB_STATUS_CONFIG,
} from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContractTerms } from "@/hooks/useContractTerms";
import ContractTermsSection from "./post-job/sections/ContractTermsSection";
import { useWallet } from "@/context/WalletContext";
import { TimeUnit } from "@/types/job";

function toMinutes(value: number, unit: TimeUnit): number {
  return unit === "days" ? value * 24 * 60 : value;
}

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
import { generateContractHash } from "@/lib/contractHash";

const PLATFORM_FEE_PERCENT = 5;

export default function EditJobForm() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);
  const { isConnected, connect, isConnecting, capNhatEscrow, taoKyQuy, address } = useWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");

  const {
    terms: contractTerms,
    setTerms: setContractTerms,
    addTerm: addContractTerm,
    updateTerm: updateContractTerm,
    removeTerm: removeContractTerm,
  } = useContractTerms();

  const [formData, setFormData] = useState<UpdateJobRequest>({
    title: "",
    description: "",
    context: "",
    requirements: "",
    deliverables: "",
    skills: [],
    complexity: "INTERMEDIATE",
    duration: "SHORT_TERM",
    workType: "PART_TIME",
    budget: undefined,
    currency: "",
    applicationDeadlineValue: 2,
    applicationDeadlineUnit: "minutes",
    submissionValue: 2,
    submissionUnit: "minutes",
    reviewValue: 2,
    reviewUnit: "minutes",
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const [jobResponse, contractResponse] = await Promise.all([
          api.getJobById(jobId),
          api.getJobContract(jobId).catch(() => null),
        ]);

        if (jobResponse.status === "SUCCESS" && jobResponse.data) {
          const jobData = jobResponse.data;

          if (jobData.status !== "DRAFT") {
            toast.error("Chỉ có thể chỉnh sửa công việc ở trạng thái Bản nháp");
            router.push("/my-posted-jobs");
            return;
          }

          if (jobData.applicationCount > 0) {
            toast.error("Không thể chỉnh sửa công việc đã có người ứng tuyển");
            router.push("/my-posted-jobs");
            return;
          }

          setJob(jobData);
          setFormData({
            title: jobData.title,
            description: jobData.description,
            context: jobData.context || "",
            requirements: jobData.requirements || "",
            deliverables: jobData.deliverables || "",
            skills: jobData.skills || [],
            complexity: jobData.complexity,
            duration: jobData.duration,
            workType: jobData.workType,
            budget: jobData.budget,
            currency: jobData.currency,
            applicationDeadline: jobData.applicationDeadline 
              ? new Date(jobData.applicationDeadline).toISOString().slice(0, 16) 
              : "",
            submissionDays: jobData.submissionDays ?? 1,
            reviewDays: jobData.reviewDays ?? 2,
          });

          if (contractResponse?.status === "SUCCESS" && contractResponse.data?.terms) {
            setContractTerms(contractResponse.data.terms);
          }
        } else {
          setError(jobResponse.message || "Không tìm thấy công việc");
        }
      } catch {
        setError("Đã có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, router, setContractTerms]);

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

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && formData.skills && formData.skills.length < 10 && !formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skillToRemove) || [],
    }));
  };

  const escrowAmount = (formData.budget || 0) * (1 + PLATFORM_FEE_PERCENT / 100);
  const platformFee = (formData.budget || 0) * (PLATFORM_FEE_PERCENT / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!formData.description?.trim()) {
      toast.error("Vui lòng nhập mô tả công việc");
      return;
    }
    if (!formData.budget || formData.budget <= 0) {
      toast.error("Vui lòng nhập ngân sách hợp lệ");
      return;
    }
    if (!formData.submissionValue || formData.submissionValue < 1) {
      toast.error("Thời gian nộp sản phẩm tối thiểu 1");
      return;
    }
    if (!formData.reviewValue || formData.reviewValue < 1) {
      toast.error("Thời gian nghiệm thu tối thiểu 1");
      return;
    }
    if (!isConnected) {
      toast.error("Vui lòng kết nối ví để lưu");
      return;
    }

    if (!formData.applicationDeadlineValue || formData.applicationDeadlineValue < 1) {
      toast.error("Hạn nộp hồ sơ tối thiểu 1");
      return;
    }

    setIsSubmitting(true);
    
    const deadlineMinutes = toMinutes(formData.applicationDeadlineValue, formData.applicationDeadlineUnit || "minutes");
    const submissionMinutes = toMinutes(formData.submissionValue, formData.submissionUnit || "minutes");
    const reviewMinutes = toMinutes(formData.reviewValue, formData.reviewUnit || "minutes");

    try {
      const validTerms = contractTerms.filter(t => t.title.trim() || t.content.trim());
      let txHash: string | undefined;
      let newEscrowId: number | undefined;

      const hasEscrow = Boolean(job?.escrowId);
      const contractData = {
        budget: formData.budget!,
        currency: "APT",
        deadlineDays: submissionMinutes,
        reviewDays: reviewMinutes,
        requirements: formData.requirements || "",
        deliverables: formData.deliverables || "",
        terms: validTerms,
      };
      const contractHash = await generateContractHash(contractData);
      const amountInOcta = Math.floor(formData.budget! * 100_000_000);
      const hanUngTuyen = deadlineMinutes * 60;
      const thoiGianLam = submissionMinutes * 60;
      const thoiGianDuyet = reviewMinutes * 60;

      if (hasEscrow && job?.escrowId) {
        toast.info("Đang cập nhật hợp đồng...");
        const result = await capNhatEscrow(job.escrowId, contractHash, amountInOcta, hanUngTuyen, thoiGianLam, thoiGianDuyet);
        if (!result) {
          throw new Error("Không thể cập nhật hợp đồng");
        }
        txHash = result;
      } else {
        toast.info("Đang tạo hợp đồng...");
        const cid = `job_${jobId}_publish_${Date.now()}`;
        const result = await taoKyQuy(cid, contractHash, amountInOcta, hanUngTuyen, thoiGianLam, thoiGianDuyet);
        if (!result) {
          throw new Error("Không thể tạo hợp đồng");
        }
        txHash = result.txHash;
        newEscrowId = result.escrowId;
      }

      toast.info("Đang lưu vào hệ thống...");
      const deadlineDate = new Date(Date.now() + deadlineMinutes * 60 * 1000);
      const applicationDeadline = formatLocalDateTime(deadlineDate);
      try {
        const response = await api.updateJob(jobId, {
          title: formData.title,
          description: formData.description,
          context: formData.context,
          requirements: formData.requirements,
          deliverables: formData.deliverables,
          skills: formData.skills,
          complexity: formData.complexity,
          duration: formData.duration,
          workType: formData.workType,
          budget: formData.budget,
          currency: formData.currency,
          applicationDeadline,
          submissionDays: submissionMinutes,
          reviewDays: reviewMinutes,
          terms: validTerms,
          txHash,
          escrowId: newEscrowId,
          walletAddress: address ?? undefined,
          contractHash,
        });

        if (response.status === "SUCCESS") {
          toast.success("Đã lưu công việc!");
          router.push("/my-posted-jobs");
        } else {
          throw new Error(response.message || "Không thể lưu công việc");
        }
      } catch (dbError: any) {
        if (newEscrowId) {
          toast.error("Lưu DB thất bại, đang hoàn tiền...");
          try {
            await api.cancelEscrow(newEscrowId);
            toast.info("Đã hoàn tiền escrow");
          } catch (refundError) {
            toast.error("Không thể hoàn tiền tự động. Escrow ID: " + newEscrowId);
          }
        }
        throw dbError;
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/my-posted-jobs"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4"
        >
          <Icon name="arrow_back" size={20} />
          Quay lại
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa công việc</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color}`}>
            {JOB_STATUS_CONFIG[job.status]?.label}
          </span>
        </div>
        <p className="text-gray-500 mt-1">Mã công việc: #{jobId}</p>
      </div>

      <fieldset disabled={isSubmitting} className="space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Basic Info */}
          <div className={`bg-white rounded-lg shadow p-6 ${isSubmitting ? "opacity-60" : ""}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề công việc <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: Thiết kế website bán hàng"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1">{(formData.title || "").length}/200 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả công việc <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết công việc cần làm..."
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bối cảnh dự án</label>
                <Textarea
                  name="context"
                  value={formData.context || ""}
                  onChange={handleChange}
                  placeholder="Giới thiệu về dự án, công ty..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu cụ thể</label>
                <Textarea
                  name="requirements"
                  value={formData.requirements || ""}
                  onChange={handleChange}
                  placeholder="Các yêu cầu về kỹ năng, kinh nghiệm..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm bàn giao</label>
                <Textarea
                  name="deliverables"
                  value={formData.deliverables || ""}
                  onChange={handleChange}
                  placeholder="Các sản phẩm cần bàn giao khi hoàn thành..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className={`bg-white rounded-lg shadow p-6 ${isSubmitting ? "opacity-60" : ""}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỹ năng yêu cầu</h2>

            <div className="flex gap-2 mb-3">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Nhập kỹ năng..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                Thêm
              </Button>
            </div>

            {formData.skills && formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#00b14f]/10 text-[#00b14f] rounded-full text-sm"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 disabled:pointer-events-none">
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Tối đa 10 kỹ năng</p>
          </div>

          {/* Job Details */}
          <div className={`bg-white rounded-lg shadow p-6 ${isSubmitting ? "opacity-60" : ""}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết công việc</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (APT)</label>
                <Input
                  type="number"
                  name="budget"
                  value={formData.budget || ""}
                  onChange={handleChange}
                  placeholder="VD: 0.5"
                  min={0}
                  step="any"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hạn nộp hồ sơ
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    name="applicationDeadlineValue"
                    value={formData.applicationDeadlineValue ?? ""}
                    onChange={handleChange}
                    min={1}
                    placeholder="VD: 2"
                    className="flex-1"
                  />
                  <select
                    name="applicationDeadlineUnit"
                    value={formData.applicationDeadlineUnit || "minutes"}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
                  >
                    <option value="minutes">Phút</option>
                    <option value="days">Ngày</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian nộp sản phẩm
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    name="submissionValue"
                    value={formData.submissionValue ?? ""}
                    onChange={handleChange}
                    min={1}
                    placeholder="VD: 2"
                    className="flex-1"
                  />
                  <select
                    name="submissionUnit"
                    value={formData.submissionUnit || "minutes"}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
                  >
                    <option value="minutes">Phút</option>
                    <option value="days">Ngày</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian nghiệm thu
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    name="reviewValue"
                    value={formData.reviewValue ?? ""}
                    onChange={handleChange}
                    min={1}
                    placeholder="VD: 2"
                    className="flex-1"
                  />
                  <select
                    name="reviewUnit"
                    value={formData.reviewUnit || "minutes"}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
                  >
                    <option value="minutes">Phút</option>
                    <option value="days">Ngày</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <ContractTermsSection
            terms={contractTerms}
            onAddTerm={addContractTerm}
            onUpdateTerm={updateContractTerm}
            onRemoveTerm={removeContractTerm}
            disabled={isSubmitting}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin ký quỹ</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngân sách:</span>
                  <span className="font-medium">{formData.budget || 0} APT</span>
                </div>
                {!job?.escrowId && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí nền tảng ({PLATFORM_FEE_PERCENT}%):</span>
                      <span className="font-medium">{platformFee.toFixed(4)} APT</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-gray-900 font-medium">Tổng ký quỹ:</span>
                      <span className="font-bold text-[#00b14f]">{escrowAmount.toFixed(4)} APT</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Lưu sẽ tạo ký quỹ mới trên hệ thống.
                    </p>
                  </>
                )}
                {job?.escrowId && (
                  <p className="text-xs text-blue-700 pt-2 border-t border-blue-300">
                    Đã có ký quỹ. Nếu thay đổi ngân sách, hệ thống sẽ tự động điều chỉnh (phí 2%).
                  </p>
                )}
              </div>
              
              {!isConnected ? (
                <Button
                  type="button"
                  onClick={connect}
                  disabled={isConnecting}
                  className="mt-4 w-full bg-[#00b14f] hover:bg-[#009643]"
                >
                  {isConnecting ? "Đang kết nối..." : "Kết nối ví để lưu"}
                </Button>
              ) : (
                <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                  <Icon name="check_circle" size={16} />
                  Ví đã kết nối, sẵn sàng lưu
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link href="/my-posted-jobs" className={isSubmitting ? "pointer-events-none" : ""}>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Hủy
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="bg-[#00b14f] hover:bg-[#009643] w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Icon name="save" size={20} />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}
