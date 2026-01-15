"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { usePostedJobs } from "@/hooks/usePostedJobs";
import { api, Dispute } from "@/lib/api";
import { JOB_STATUS_CONFIG, JobStatus, Job } from "@/types/job";
import JobsLoading from "../shared/JobsLoading";
import JobsEmptyState from "../shared/JobsEmptyState";
import JobsPageHeader from "../shared/JobsPageHeader";
import JobHistoryTimeline from "../shared/JobHistoryTimeline";
import { CreateDisputeDialog, ViewDisputeDialog } from "../dispute/DisputeDialog";
import { WorkReviewDialog } from "../work/WorkDialogs";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmployerJobCard from "./posted/EmployerJobCard";

const FILTER_TABS: { key: JobStatus | "all" | "history" | "review"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "DRAFT", label: "Bản nháp" },
  { key: "OPEN", label: "Đang tuyển" },
  { key: "IN_PROGRESS", label: "Đang thực hiện" },
  { key: "review", label: "Chờ nghiệm thu" },
  { key: "DISPUTED", label: "Tranh chấp" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "history", label: "Lịch sử" },
];

export default function PostedJobsList() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { jobs, page, isLoading, error, fetchJobs } = usePostedJobs();
  const [filter, setFilter] = useState<JobStatus | "all" | "history" | "review">("all");
  const isHistoryTab = filter === "history";
  const isReviewTab = filter === "review";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyJobId, setHistoryJobId] = useState<number | null>(null);
  
  // Dispute states
  const [createDisputeDialogOpen, setCreateDisputeDialogOpen] = useState(false);
  const [disputeJob, setDisputeJob] = useState<Job | null>(null);
  const [viewDisputeDialogOpen, setViewDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);

  // Work review states
  const [workReviewDialogOpen, setWorkReviewDialogOpen] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState<Job | null>(null);

  const hasAccess = user?.roles?.includes("ROLE_EMPLOYER");

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !hasAccess) {
      router.push("/");
    }
  }, [isHydrated, isAuthenticated, hasAccess, router]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && hasAccess) {
      if (filter === "history") {
        // Tab lịch sử: lấy job IN_PROGRESS và COMPLETED
        fetchJobs({ status: "IN_PROGRESS" as JobStatus });
      } else if (filter === "review") {
        // Tab chờ nghiệm thu: lấy job IN_PROGRESS có workReviewDeadline
        fetchJobs({ status: "IN_PROGRESS" as JobStatus });
      } else if (filter === "all") {
        fetchJobs({});
      } else {
        fetchJobs({ status: filter as JobStatus });
      }
    }
  }, [isHydrated, isAuthenticated, hasAccess, filter, fetchJobs]);

  const formatBudget = (budget?: number, currency?: string) => {
    if (!budget) return "Thương lượng";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "VND",
    }).format(budget);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chưa xác định";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatJobBudget = (job: Job) => formatBudget(job.budget, job.currency);

  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleHistoryClick = (jobId: number) => {
    setHistoryJobId(jobId);
    setHistoryDialogOpen(true);
  };

  const handleCreateDispute = (job: Job) => {
    setDisputeJob(job);
    setCreateDisputeDialogOpen(true);
  };

  const handleViewDispute = async (jobId: number) => {
    try {
      const response = await api.getDispute(jobId);
      if (response.status === "SUCCESS" && response.data) {
        setCurrentDispute(response.data);
        setViewDisputeDialogOpen(true);
      } else {
        toast.error("Không tìm thấy thông tin khiếu nại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleReviewWork = (job: Job) => {
    setSelectedJobForReview(job);
    setWorkReviewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await api.deleteJob(jobToDelete.id);
      if (response.status === "SUCCESS") {
        toast.success(response.message || "Xóa công việc thành công");
        setDeleteDialogOpen(false);
        setJobToDelete(null);
        fetchJobs(filter === "all" || filter === "history" ? {} : { status: filter as JobStatus });
      } else {
        toast.error(response.message || "Không thể xóa công việc");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <JobsLoading />
      </div>
    );
  }

  if (!isAuthenticated || !user || !hasAccess) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Page Header */}
      <JobsPageHeader 
        title="Quản lý công việc đã đăng"
        subtitle={page ? `${page.totalElements} công việc` : "Xem và quản lý các công việc bạn đã đăng tuyển"}
      >
        <Link href="/my-posted-jobs/create">
          <Button className="bg-[#00b14f] hover:bg-[#009643] w-full sm:w-auto">
            <Icon name="add" size={20} />
            Đăng việc mới
          </Button>
        </Link>
      </JobsPageHeader>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex flex-wrap border-b border-gray-200 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? "text-[#00b14f] border-b-2 border-[#00b14f]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <JobsLoading />
      ) : isReviewTab ? (
        /* Review Tab Content - Jobs waiting for review */
        <div className="space-y-3">
          {(() => {
            const reviewJobs = jobs.filter(j => j.workReviewDeadline);
            return reviewJobs.length === 0 ? (
              <JobsEmptyState 
                icon="rate_review" 
                message="Không có sản phẩm nào chờ nghiệm thu"
              />
            ) : (
              reviewJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">#{job.id}</span>
                        <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-[#00b14f]">
                          {job.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color}`}>
                          {JOB_STATUS_CONFIG[job.status]?.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{formatBudget(job.budget, job.currency)}</p>

                      {job.workReviewDeadline && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg mb-3">
                          <Icon name="timer" size={16} />
                          <span>Hạn nghiệm thu: {formatDate(job.workReviewDeadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-[#00b14f] hover:bg-[#009643]"
                        onClick={() => handleReviewWork(job)}
                      >
                        <Icon name="rate_review" size={16} />
                        <span className="ml-1">Duyệt sản phẩm</span>
                      </Button>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Icon name="visibility" size={16} />
                          <span className="ml-1">Chi tiết</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            );
          })()}
        </div>
      ) : isHistoryTab ? (
        /* History Tab Content */
        <div className="space-y-3">
          {jobs.filter(j => j.status === "IN_PROGRESS" || j.status === "COMPLETED").length === 0 ? (
            <JobsEmptyState 
              icon="history" 
              message="Chưa có công việc nào có lịch sử hoạt động"
            />
          ) : (
            jobs.filter(j => j.status === "IN_PROGRESS" || j.status === "COMPLETED").map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Job Header - Clickable */}
                <button
                  onClick={() => setHistoryJobId(historyJobId === job.id ? null : job.id)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">#{job.id}</span>
                        <span className="font-semibold text-gray-900 truncate">{job.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color}`}>
                          {JOB_STATUS_CONFIG[job.status]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{formatBudget(job.budget, job.currency)}</p>
                    </div>
                    <Icon 
                      name={historyJobId === job.id ? "expand_less" : "expand_more"} 
                      size={24} 
                      className="text-gray-400 shrink-0"
                    />
                  </div>
                </button>

                {/* Expanded History */}
                {historyJobId === job.id && (
                  <div className="border-t bg-gray-50 p-4 sm:p-5">
                    <JobHistoryTimeline jobId={job.id} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Normal Job List */
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <JobsEmptyState message="Không có công việc nào" />
          ) : (
            jobs.map((job) => (
              <EmployerJobCard
                key={job.id}
                job={job}
                formatBudget={formatJobBudget}
                formatDate={formatDate}
                onDelete={handleDeleteClick}
                onReviewWork={handleReviewWork}
                onCreateDispute={handleCreateDispute}
                onViewDispute={handleViewDispute}
                onViewHistory={handleHistoryClick}
                showHistoryButton={
                  ["IN_PROGRESS", "COMPLETED", "DISPUTED"].includes(job.status)
                }
              />
            ))
          )}
        </div>
      )}

      {/* Pagination - not shown for history tab */}
      {!isHistoryTab && page && page.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page.first}
            onClick={() => fetchJobs({ 
              status: filter === "all" ? undefined : filter as JobStatus, 
              page: page.number - 1 
            })}
          >
            Trước
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Trang {page.number + 1} / {page.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page.last}
            onClick={() => fetchJobs({ 
              status: filter === "all" ? undefined : filter as JobStatus, 
              page: page.number + 1 
            })}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          if (!isDeleting) setDeleteDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa công việc</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa công việc này?
            </DialogDescription>
          </DialogHeader>
          
          {jobToDelete && (
            <div className="py-4">
              <p className="font-medium text-gray-900 mb-2">#{jobToDelete.id} - {jobToDelete.title}</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon name="info" size={20} className="text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Khi xóa, tiền sẽ được hoàn lại vào số dư tài khoản của bạn.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Icon name="delete" size={16} />
                  Xóa công việc
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
          <DialogHeader>
            <DialogTitle>Lịch sử hoạt động</DialogTitle>
            <DialogDescription>
              Xem các hoạt động liên quan đến công việc này
            </DialogDescription>
          </DialogHeader>
          {historyJobId && (
            <JobHistoryTimeline jobId={historyJobId} />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dispute Dialog */}
      {disputeJob && (
        <CreateDisputeDialog
          open={createDisputeDialogOpen}
          onOpenChange={setCreateDisputeDialogOpen}
          jobId={disputeJob.id}
          jobTitle={disputeJob.title}
          onSuccess={() => {
            fetchJobs(filter === "all" || filter === "history" ? {} : { status: filter as JobStatus });
          }}
        />
      )}

      {/* View Dispute Dialog */}
      <ViewDisputeDialog
        open={viewDisputeDialogOpen}
        onOpenChange={setViewDisputeDialogOpen}
        dispute={currentDispute}
      />

      {/* Work Review Dialog */}
      {selectedJobForReview && (
        <WorkReviewDialog
          open={workReviewDialogOpen}
          onOpenChange={setWorkReviewDialogOpen}
          jobId={selectedJobForReview.id}
          jobTitle={selectedJobForReview.title}
          onSuccess={() => {
            // Refresh jobs after review
            if (filter === "all" || filter === "history" || filter === "review") {
              fetchJobs(filter === "review" ? { status: "IN_PROGRESS" as JobStatus } : {});
            } else {
              fetchJobs({ status: filter as JobStatus });
            }
          }}
        />
      )}
    </div>
  );
}
