"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

import { usePostJobForm } from "@/hooks/usePostJobForm";
import { useContractTerms } from "@/hooks/useContractTerms";
import { useSkills } from "@/hooks/useSkills";

import BasicInfoSection from "./sections/BasicInfoSection";
import SkillsSection from "./sections/SkillsSection";
import JobDetailsSection from "./sections/JobDetailsSection";
import ContractTermsSection from "./sections/ContractTermsSection";

import ConfirmStep from "./steps/ConfirmStep";

export default function PostJobForm() {
  const router = useRouter();
  const { isConnected, connect, isConnecting } = useWallet();
  const [saveMode, setSaveMode] = useState<"draft" | "publish">("publish");
  
  const {
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
  } = usePostJobForm(() => router.push("/my-posted-jobs"));

  const {
    terms: contractTerms,
    addTerm: addContractTerm,
    updateTerm: updateContractTerm,
    removeTerm: removeContractTerm,
  } = useContractTerms();

  const {
    skillInput,
    setSkillInput,
    addSkill,
    removeSkill,
  } = useSkills(formData, setFormData);

  if (step === "confirm" || step === "processing") {
    return (
      <ConfirmStep
        formData={formData}
        contractTerms={contractTerms}
        escrowAmount={escrowAmount}
        platformFee={platformFee}
        platformFeePercent={PLATFORM_FEE_PERCENT}
        isSubmitting={isSubmitting}
        onBack={() => setStep("form")}
        onSubmit={() => handleSubmit(contractTerms)}
      />
    );
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveMode === "draft") {
      handleSaveDraft(contractTerms);
    } else {
      handleProceedToConfirm();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6">
        <Link
          href="/my-posted-jobs"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4"
        >
          <Icon name="arrow_back" size={20} />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Đăng việc mới</h1>
        <p className="text-gray-500 mt-1">Điền thông tin để tìm kiếm người làm phù hợp</p>
      </div>

      <fieldset disabled={isSubmitting} className="space-y-3">
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <BasicInfoSection
            formData={formData}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <SkillsSection
            skills={formData.skills}
            skillInput={skillInput}
            onSkillInputChange={setSkillInput}
            onAddSkill={addSkill}
            onRemoveSkill={removeSkill}
            disabled={isSubmitting}
          />

          <JobDetailsSection
            formData={formData}
            onChange={handleChange}
            escrowAmount={escrowAmount}
            platformFeePercent={PLATFORM_FEE_PERCENT}
            disabled={isSubmitting}
          />

          <ContractTermsSection
            terms={contractTerms}
            onAddTerm={addContractTerm}
            onUpdateTerm={updateContractTerm}
            onRemoveTerm={removeContractTerm}
            disabled={isSubmitting}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hình thức lưu</h2>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${saveMode === "draft" ? "border-[#00b14f] bg-[#00b14f]/5" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="saveMode"
                  value="draft"
                  checked={saveMode === "draft"}
                  onChange={() => setSaveMode("draft")}
                  className="mt-1 accent-[#00b14f]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon name="save" size={20} />
                    <span className="font-medium text-gray-900">Lưu bản nháp</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Lưu lại để chỉnh sửa sau. Không cần kết nối ví, không tốn phí.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${saveMode === "publish" ? "border-[#00b14f] bg-[#00b14f]/5" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="saveMode"
                  value="publish"
                  checked={saveMode === "publish"}
                  onChange={() => setSaveMode("publish")}
                  className="mt-1 accent-[#00b14f]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon name="visibility" size={20} />
                    <span className="font-medium text-gray-900">Công khai ngay</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Thanh toán ký quỹ và đăng công khai để người làm ứng tuyển.
                  </p>
                  {saveMode === "publish" && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ngân sách:</span>
                          <span className="font-medium">{formData.budget || 0} APT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phí nền tảng ({PLATFORM_FEE_PERCENT}%):</span>
                          <span className="font-medium">{platformFee.toFixed(4)} APT</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-200">
                          <span className="text-gray-900 font-medium">Tổng ký quỹ:</span>
                          <span className="font-bold text-[#00b14f]">{escrowAmount.toFixed(4)} APT</span>
                        </div>
                      </div>
                      {!isConnected && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={connect}
                          disabled={isConnecting}
                          className="mt-3 w-full bg-[#00b14f] hover:bg-[#009643]"
                        >
                          {isConnecting ? "Đang kết nối..." : "Kết nối ví để thanh toán"}
                        </Button>
                      )}
                      {isConnected && (
                        <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <Icon name="check_circle" size={14} />
                          Ví đã kết nối, sẵn sàng thanh toán
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </label>
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
              disabled={isSubmitting || (saveMode === "publish" && !isConnected)}
              className="bg-[#00b14f] hover:bg-[#009643] w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : saveMode === "draft" ? (
                <>
                  <Icon name="save" size={20} />
                  Lưu bản nháp
                </>
              ) : (
                <>
                  <Icon name="arrow_forward" size={20} />
                  Tiếp tục thanh toán
                </>
              )}
            </Button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}
