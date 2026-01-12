"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Job,
  JOB_STATUS_CONFIG,
  JOB_COMPLEXITY_CONFIG,
  JOB_DURATION_CONFIG,
  WORK_TYPE_CONFIG,
} from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function JobDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isOwner = user && job && user.id === job.employer.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, paymentRes] = await Promise.all([
          api.getJobById(jobId),
          api.getPaymentByJobId(jobId).catch(() => null),
        ]);

        if (jobRes.status === "SUCCESS" && jobRes.data) {
          setJob(jobRes.data);
        } else {
          setError(jobRes.message || "Không tìm thấy công việc");
        }

        // Check if payment exists and is PAID
        if (paymentRes?.status === "SUCCESS" && paymentRes.data?.status === "PAID") {
          setIsPaid(true);
        }
      } catch {
        setError("Đã có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  const handleToggleStatus = async () => {
    if (!job) return;
    
    setIsToggling(true);
    try {
      const response = await api.toggleJobStatus(jobId);
      if (response.status === "SUCCESS" && response.data) {
        setJob(response.data);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Không thể thay đổi trạng thái");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsToggling(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
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
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="error" size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h1>
          <p className="text-gray-600 mb-6">{error || "Không tìm thấy công việc"}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4"
      >
        <Icon name="arrow_back" size={20} />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color}`}>
                    {JOB_STATUS_CONFIG[job.status]?.label}
                  </span>
                  <span className="text-gray-400 text-sm">#{job.id}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon name="visibility" size={16} />
                    {job.viewCount} lượt xem
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="group" size={16} />
                    {job.applicationCount} ứng viên
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="schedule" size={16} />
                    {formatRelativeTime(job.createdAt)}
                  </span>
                </div>
              </div>
              {isOwner && (
                <Link href={`/jobs/${job.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Icon name="edit" size={16} />
                    Sửa
                  </Button>
                </Link>
              )}
            </div>

            {/* Budget */}
            {job.budget && (
              <div className="bg-[#00b14f]/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">Ngân sách</p>
                <p className="text-2xl font-bold text-[#00b14f]">
                  {formatCurrency(job.budget, job.currency)}
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                {JOB_COMPLEXITY_CONFIG[job.complexity]?.label}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                {JOB_DURATION_CONFIG[job.duration]?.label}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                {WORK_TYPE_CONFIG[job.workType]?.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả công việc</h2>
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
            </div>
          </div>

          {/* Context */}
          {job.context && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bối cảnh dự án</h2>
              <p className="whitespace-pre-wrap text-gray-700">{job.context}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu</h2>
              <p className="whitespace-pre-wrap text-gray-700">{job.requirements}</p>
            </div>
          )}

          {/* Deliverables */}
          {job.deliverables && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm bàn giao</h2>
              <p className="whitespace-pre-wrap text-gray-700">{job.deliverables}</p>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỹ năng yêu cầu</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Employer Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bên thuê</h2>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={job.employer.avatarUrl} alt={job.employer.fullName} />
                <AvatarFallback className="bg-[#00b14f] text-white">
                  {job.employer.fullName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  {job.employer.fullName}
                  {job.employer.isVerified && (
                    <Icon name="verified" size={16} className="text-blue-500" />
                  )}
                </p>
                {job.employer.title && (
                  <p className="text-sm text-gray-500">{job.employer.title}</p>
                )}
              </div>
            </div>
            {job.employer.company && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Icon name="business" size={16} className="text-gray-400" />
                {job.employer.company}
              </div>
            )}
            {job.employer.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Icon name="location_on" size={16} className="text-gray-400" />
                {job.employer.location}
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thời gian</h2>
            <div className="space-y-3">
              {job.applicationDeadline && (
                <div className="flex items-start gap-3">
                  <Icon name="event" size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hạn nộp hồ sơ</p>
                    <p className="font-medium text-gray-900">{formatDate(job.applicationDeadline)}</p>
                  </div>
                </div>
              )}
              {job.expectedStartDate && (
                <div className="flex items-start gap-3">
                  <Icon name="play_circle" size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Dự kiến bắt đầu</p>
                    <p className="font-medium text-gray-900">{formatDate(job.expectedStartDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Icon name="hourglass_empty" size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Thời hạn dự án</p>
                  <p className="font-medium text-gray-900">
                    {JOB_DURATION_CONFIG[job.duration]?.label} ({JOB_DURATION_CONFIG[job.duration]?.description})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          {!isOwner && job.status === "OPEN" && (
            <Button className="w-full bg-[#00b14f] hover:bg-[#009643] text-white py-3">
              <Icon name="send" size={20} />
              Ứng tuyển ngay
            </Button>
          )}

          {/* Owner Actions */}
          {isOwner && (job.status === "DRAFT" || job.status === "OPEN") && (
            <div className="bg-white rounded-lg shadow p-4">
              {isPaid ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    {job.status === "DRAFT" 
                      ? "Công việc đang ẩn. Chuyển sang công khai để nhận ứng viên."
                      : "Công việc đang công khai. Chuyển sang nháp để tạm ẩn."}
                  </p>
                  <Button
                    onClick={handleToggleStatus}
                    disabled={isToggling}
                    className={`w-full ${
                      job.status === "DRAFT"
                        ? "bg-[#00b14f] hover:bg-[#009643]"
                        : "bg-gray-600 hover:bg-gray-700"
                    } text-white`}
                  >
                    {isToggling ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name={job.status === "DRAFT" ? "visibility" : "visibility_off"} size={20} />
                    )}
                    {job.status === "DRAFT" ? "Đăng công khai" : "Chuyển về nháp"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Công việc đang ở trạng thái nháp. Thanh toán để đăng tin.
                  </p>
                  <Link href={`/jobs/${job.id}/payment`}>
                    <Button className="w-full bg-[#00b14f] hover:bg-[#009643] text-white">
                      <Icon name="payment" size={20} />
                      Thanh toán
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã công việc</span>
                <span className="font-medium text-gray-900">#{job.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày đăng</span>
                <span className="font-medium text-gray-900">{formatDate(job.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cập nhật</span>
                <span className="font-medium text-gray-900">{formatDate(job.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
