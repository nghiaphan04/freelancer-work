"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { FormData, TimeUnit } from "@/hooks/usePostJobForm";
import { ContractTerm } from "@/hooks/useContractTerms";
import SystemTermsDisplay from "../sections/SystemTermsDisplay";

function toMinutes(value: number, unit: TimeUnit): number {
  return unit === "days" ? value * 24 * 60 : value;
}

interface ConfirmStepProps {
  formData: FormData;
  contractTerms: ContractTerm[];
  escrowAmount: number;
  platformFee: number;
  platformFeePercent: number;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ConfirmStep({
  formData,
  contractTerms,
  escrowAmount,
  platformFee,
  platformFeePercent,
  isSubmitting,
  onBack,
  onSubmit,
}: ConfirmStepProps) {
  const validTerms = contractTerms.filter(t => t.title.trim() || t.content.trim());
  const jobTermsCount = 1 + (formData.deliverables ? 1 : 0) + validTerms.length;
  
  const submissionMinutes = toMinutes(formData.submissionValue, formData.submissionUnit);
  const reviewMinutes = toMinutes(formData.reviewValue, formData.reviewUnit);

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-6">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4 disabled:opacity-50"
        >
          <Icon name="arrow_back" size={20} />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Xác nhận tạo công việc</h1>
        <p className="text-gray-500 mt-1">Kiểm tra thông tin và xác nhận thanh toán</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Job Summary */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{formData.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{formData.description}</p>
        </div>

        {/* Payment Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Ngân sách:</span>
            <span className="font-medium">{formData.budget.toFixed(4)} APT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phí nền tảng ({platformFeePercent}%):</span>
            <span className="font-medium">{platformFee.toFixed(4)} APT</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Tổng escrow:</span>
            <span className="text-[#00b14f]">{escrowAmount.toFixed(4)} APT</span>
          </div>
        </div>

        {/* Requirements */}
        {formData.requirements && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Yêu cầu:</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">
              {formData.requirements}
            </p>
          </div>
        )}

        {/* Contract Document */}
        <div className="border-t pt-4">
          <div className="border border-gray-200 rounded-lg bg-white">
            {/* Document Header */}
            <div className="px-5 py-4 border-b border-gray-200 text-center">
              <h2 className="text-sm font-bold uppercase text-gray-800">Hợp đồng công việc</h2>
              <p className="text-xs text-gray-500 mt-1">Xác thực trên Blockchain Aptos</p>
            </div>
            
            {/* Document Body */}
            <div className="px-5 py-4 max-h-96 overflow-y-auto text-sm leading-relaxed scrollbar-thin">
              {/* PHẦN A - ĐIỀU KHOẢN CÔNG VIỆC */}
              <div className="mb-6">
                <h4 className="font-bold text-center text-gray-800 mb-4 pb-2 border-b border-gray-300">
                  PHẦN A - ĐIỀU KHOẢN CÔNG VIỆC
                </h4>
                
                {/* Thời hạn thực hiện */}
                <div className="mb-3">
                  <p className="text-justify">
                    <span className="font-semibold">Điều 1. Thời hạn thực hiện</span>
                    {": "}
                    <span className="text-gray-700">
                      Bên B cam kết hoàn thành và bàn giao sản phẩm trong thời hạn {submissionMinutes} phút kể từ ngày ký hợp đồng. 
                      Bên A có trách nhiệm nghiệm thu sản phẩm trong thời hạn {reviewMinutes} phút kể từ ngày nhận bàn giao.
                    </span>
                  </p>
                </div>

                {/* Sản phẩm bàn giao */}
                {formData.deliverables && (
                  <div className="mb-3">
                    <p className="text-justify">
                      <span className="font-semibold">Điều 2. Sản phẩm bàn giao</span>
                      {": "}
                      <span className="text-gray-700 whitespace-pre-line">
                        Bên B cam kết bàn giao cho Bên A các sản phẩm sau:
                        {"\n"}{formData.deliverables}
                      </span>
                    </p>
                  </div>
                )}

                {/* Custom Terms */}
                {validTerms.map((term, index) => (
                  <div key={index} className="mb-3">
                    <p className="text-justify">
                      <span className="font-semibold">
                        Điều {(formData.deliverables ? 2 : 1) + index + 1}. {term.title}
                      </span>
                      {": "}
                      <span className="text-gray-700 whitespace-pre-line">{term.content}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* PHẦN B - QUY ĐỊNH HỆ THỐNG */}
              <div>
                <h4 className="font-bold text-center text-gray-800 mb-4 pb-2 border-b border-gray-300">
                  PHẦN B - QUY ĐỊNH HỆ THỐNG
                </h4>
                <p className="text-xs text-gray-500 italic mb-3 text-center">
                  (Được quy định bởi Smart Contract trên blockchain Aptos - Không thể thay đổi)
                </p>
                <SystemTermsDisplay
                  budget={formData.budget}
                  submissionDays={submissionMinutes}
                  reviewDays={reviewMinutes}
                  platformFeePercent={platformFeePercent}
                  startIndex={jobTermsCount}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            Quay lại
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-[#00b14f] hover:bg-[#009643]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Icon name="lock" size={18} />
                Xác nhận
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
