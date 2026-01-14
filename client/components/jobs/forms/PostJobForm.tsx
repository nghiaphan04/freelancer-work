"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  CreateJobRequest,
  JobComplexity,
  JobDuration,
  WorkType,
  JOB_COMPLEXITY_CONFIG,
  JOB_DURATION_CONFIG,
  WORK_TYPE_CONFIG,
} from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PostJobForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState<CreateJobRequest>({
    title: "Thiết kế website bán hàng thời trang",
    description: "Cần tìm người làm thiết kế website bán hàng thời trang với giao diện hiện đại, responsive trên mọi thiết bị. Website cần tích hợp giỏ hàng, thanh toán online và quản lý đơn hàng.",
    context: "Chúng tôi là startup thời trang mới thành lập, cần một website chuyên nghiệp để bán hàng online. Hiện tại đang bán qua các kênh social media nhưng muốn có website riêng.",
    requirements: "- Có kinh nghiệm thiết kế website e-commerce\n- Thành thạo React/Next.js và TailwindCSS\n- Hiểu về UX/UI cho e-commerce\n- Có portfolio các dự án tương tự",
    deliverables: "- Source code hoàn chỉnh\n- Hướng dẫn deploy và sử dụng\n- Hỗ trợ fix bug trong 30 ngày",
    skills: ["React", "Next.js", "TailwindCSS", "TypeScript", "UI/UX"],
    complexity: "INTERMEDIATE",
    duration: "SHORT_TERM",
    workType: "PART_TIME",
    budget: 15000000,
    currency: "VND",
    applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    submissionDays: 7,
    reviewDays: 3,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "budget" || name === "submissionDays" || name === "reviewDays"
          ? value
            ? Number(value)
            : undefined
          : value,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả công việc");
      return;
    }
    if (!formData.submissionDays || formData.submissionDays < 1) {
      toast.error("Thời gian nộp sản phẩm tối thiểu 1 ngày");
      return;
    }
    if (!formData.reviewDays || formData.reviewDays < 2) {
      toast.error("Thời gian nghiệm thu tối thiểu 2 ngày");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createJob({
        ...formData,
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : undefined,
      });

      if (response.status === "SUCCESS" && response.data) {
        toast.success(response.message || "Tạo công việc thành công!");
        router.push(`/my-posted-jobs`);
      } else {
        toast.error(response.message || "Không thể tạo công việc");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Đăng việc mới</h1>
        <p className="text-gray-500 mt-1">Điền thông tin để tìm kiếm người làm phù hợp</p>
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
                <p className="text-xs text-gray-400 mt-1">{formData.title.length}/200 ký tự</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ phức tạp</label>
                <select
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {(Object.keys(JOB_COMPLEXITY_CONFIG) as JobComplexity[]).map((key) => (
                    <option key={key} value={key}>
                      {JOB_COMPLEXITY_CONFIG[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn dự án</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {(Object.keys(JOB_DURATION_CONFIG) as JobDuration[]).map((key) => (
                    <option key={key} value={key}>
                      {JOB_DURATION_CONFIG[key].label} - {JOB_DURATION_CONFIG[key].description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại công việc</label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {(Object.keys(WORK_TYPE_CONFIG) as WorkType[]).map((key) => (
                    <option key={key} value={key}>
                      {WORK_TYPE_CONFIG[key].label} - {WORK_TYPE_CONFIG[key].description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (VND)</label>
                <Input
                  type="number"
                  name="budget"
                  value={formData.budget || ""}
                  onChange={handleChange}
                  placeholder="VD: 5000000"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp hồ sơ</label>
                <Input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian nộp sản phẩm (ngày, tối thiểu 1)
                </label>
                <Input
                  type="number"
                  name="submissionDays"
                  value={formData.submissionDays ?? ""}
                  onChange={handleChange}
                  min={1}
                  placeholder="VD: 7"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian nghiệm thu (ngày, tối thiểu 2)
                </label>
                <Input
                  type="number"
                  name="reviewDays"
                  value={formData.reviewDays ?? ""}
                  onChange={handleChange}
                  min={2}
                  placeholder="VD: 3"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link href="/my-posted-jobs" className={isSubmitting ? "pointer-events-none" : ""}>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Hủy
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00b14f] hover:bg-[#009643] w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Icon name="add" size={20} />
                  Tạo công việc
                </>
              )}
            </Button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}
