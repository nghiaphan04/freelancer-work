"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { toast } from "sonner";
import { api, JobApplication } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Job } from "@/types/job";
import Icon from "@/components/ui/Icon";
import JobDetailHeader from "./JobDetailHeader";
import JobDetailContent from "./JobDetailContent";
import JobDetailSidebar from "./JobDetailSidebar";
import JobApplyDialog from "./JobApplyDialog";

const DEFAULT_COVER_LETTER = "Chào anh/chị,\n\nTôi rất quan tâm đến vị trí này và tin rằng kỹ năng cùng kinh nghiệm của tôi sẽ phù hợp với yêu cầu công việc.\n\nRất mong được hợp tác cùng anh/chị.\n\nTrân trọng.";

export default function JobDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Apply dialog
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState(DEFAULT_COVER_LETTER);
  const [isApplying, setIsApplying] = useState(false);
  const [myApplication, setMyApplication] = useState<JobApplication | null>(null);

  const isOwner = user && job && user.id === job.employer.id;
  const hasApplied = !!myApplication;

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.getJobById(jobId);
        if (res.status === "SUCCESS" && res.data) {
          setJob(res.data);
        } else {
          setError(res.message || "Không tìm thấy công việc");
        }
      } catch {
        setError("Đã có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMyApplication = async () => {
      try {
        const res = await api.getMyApplicationForJob(jobId);
        if (res.status === "SUCCESS" && res.data) {
          setMyApplication(res.data);
        }
      } catch {
      }
    };

    if (jobId) {
      fetchJob();
      if (user) {
        fetchMyApplication();
      }
    }
  }, [jobId, user]);

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

  const handleApply = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để ứng tuyển");
      router.push("/login");
      return;
    }

    setIsApplying(true);
    try {
      const response = await api.applyJob(jobId, { 
        coverLetter: coverLetter.trim() || undefined
      });
      if (response.status === "SUCCESS") {
        toast.success(response.message || "Ứng tuyển thành công!");
        setShowApplyDialog(false);
        setCoverLetter("");
        setMyApplication(response.data);
        if (job) {
          setJob({ ...job, applicationCount: job.applicationCount + 1 });
        }
      } else {
        toast.error(response.message || "Không thể ứng tuyển");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsApplying(false);
    }
  };

  // Utility functions
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
    notFound();
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3">
          <JobDetailHeader
            job={job}
            isOwner={!!isOwner}
            formatCurrency={formatCurrency}
            formatRelativeTime={formatRelativeTime}
          />
          <JobDetailContent job={job} />
        </div>

        {/* Sidebar */}
        <JobDetailSidebar
          job={job}
          isOwner={!!isOwner}
          isToggling={isToggling}
          hasApplied={hasApplied}
          myApplication={myApplication}
          onApply={() => setShowApplyDialog(true)}
          onToggleStatus={handleToggleStatus}
          formatDate={formatDate}
        />
      </div>

      {/* Apply Dialog */}
      <JobApplyDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        jobTitle={job.title}
        coverLetter={coverLetter}
        onCoverLetterChange={setCoverLetter}
        onSubmit={handleApply}
        isLoading={isApplying}
      />
    </div>
  );
}
