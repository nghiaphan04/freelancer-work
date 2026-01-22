"use client";

import { Input } from "@/components/ui/input";
import { FormData } from "@/hooks/usePostJobForm";

interface JobDetailsSectionProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  escrowAmount: number;
  platformFeePercent: number;
  disabled?: boolean;
}

export default function JobDetailsSection({
  formData,
  onChange,
  escrowAmount,
  platformFeePercent,
  disabled,
}: JobDetailsSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${disabled ? "opacity-60" : ""}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết công việc</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngân sách (APT) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            name="budget"
            value={formData.budget || ""}
            onChange={onChange}
            placeholder="VD: 0.5"
            min={0.01}
            step={0.01}
          />
          <p className="text-xs text-gray-400 mt-1">
            Tổng escrow: {escrowAmount.toFixed(4)} APT (bao gồm {platformFeePercent}% phí)
          </p>
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
              onChange={onChange}
              min={1}
              placeholder="VD: 2"
              className="flex-1"
            />
            <select
              name="applicationDeadlineUnit"
              value={formData.applicationDeadlineUnit}
              onChange={onChange}
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
              onChange={onChange}
              min={1}
              placeholder="VD: 2"
              className="flex-1"
            />
            <select
              name="submissionUnit"
              value={formData.submissionUnit}
              onChange={onChange}
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
              onChange={onChange}
              min={1}
              placeholder="VD: 2"
              className="flex-1"
            />
            <select
              name="reviewUnit"
              value={formData.reviewUnit}
              onChange={onChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
            >
              <option value="minutes">Phút</option>
              <option value="days">Ngày</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
