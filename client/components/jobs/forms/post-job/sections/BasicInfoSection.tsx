"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormData } from "@/hooks/usePostJobForm";

interface BasicInfoSectionProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export default function BasicInfoSection({ formData, onChange, disabled }: BasicInfoSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${disabled ? "opacity-60" : ""}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề công việc <span className="text-red-500">*</span>
          </label>
          <Input
            name="title"
            value={formData.title}
            onChange={onChange}
            placeholder="VD: Thiết kế website bán hàng"
            maxLength={200}
          />
          <p className="text-xs text-gray-400 mt-1">{formData.title.length}/200 ký tự</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả công việc <span className="text-red-500">*</span>
          </label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Mô tả chi tiết công việc cần làm..."
            rows={5}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bối cảnh dự án</label>
          <Textarea
            name="context"
            value={formData.context || ""}
            onChange={onChange}
            placeholder="Giới thiệu về dự án, công ty..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu cụ thể</label>
          <Textarea
            name="requirements"
            value={formData.requirements || ""}
            onChange={onChange}
            placeholder="Các yêu cầu về kỹ năng, kinh nghiệm..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm bàn giao</label>
          <Textarea
            name="deliverables"
            value={formData.deliverables || ""}
            onChange={onChange}
            placeholder="Các sản phẩm cần bàn giao khi hoàn thành..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
