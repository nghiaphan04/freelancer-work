"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { usePostedJobs } from "@/hooks/usePostedJobs";
import { api, Dispute } from "@/lib/api";
import { JobStatus, Job } from "@/types/job";
import JobsLoading from "../../shared/JobsLoading";
import JobsEmptyState from "../../shared/JobsEmptyState";
import JobsPageHeader from "../../shared/JobsPageHeader";
import JobHistoryTimeline from "../../shared/JobHistoryTimeline";
import { CreateDisputeDialog, ViewDisputeDialog } from "../../dispute/DisputeDialog";
import { WorkReviewDialog } from "../../work/WorkDialogs";
import EmployerJobCard from "./EmployerJobCard";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Hooks & Components
import { useDeleteJob } from "@/hooks/useDeleteJob";
import DeleteJobDialog from "./dialogs/DeleteJobDialog";
import RepostJobDialog from "./dialogs/RepostJobDialog";
import PaymentDialog from "./dialogs/PaymentDialog";
import ReviewTab from "./tabs/ReviewTab";
import HistoryTab from "./tabs/HistoryTab";

const MAIN_TABS = [
  { key: "jobs", label: "Công việc" },
  { key: "review", label: "Sản phẩm đã nghiệm thu" },
  { key: "history", label: "Lịch sử" },
];

const JOB_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "DRAFT", label: "Bản nháp" },
  { key: "OPEN", label: "Đang tuyển" },
  { key: "PENDING_SIGNATURE", label: "Chờ ký" },
  { key: "IN_PROGRESS", label: "Đang thực hiện" },
  { key: "DISPUTED", label: "Tranh chấp" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "EXPIRED", label: "Hết hạn" },
];

export default function PostedJobsList() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { jobs, page, isLoading, error, fetchJobs } = usePostedJobs();
  
  // Tab state
  const [mainTab, setMainTab] = useState<"jobs" | "review" | "history">("jobs");
  const [jobFilter, setJobFilter] = useState<string>("all");
  
  const isHistoryTab = mainTab === "history";
  const isReviewTab = mainTab === "review";

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyJobId, setHistoryJobId] = useState<number | null>(null);
  
  // Dispute
  const [createDisputeDialogOpen, setCreateDisputeDialogOpen] = useState(false);
  const [disputeJob, setDisputeJob] = useState<Job | null>(null);
  const [viewDisputeDialogOpen, setViewDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);

  // Work Review
  const [workReviewDialogOpen, setWorkReviewDialogOpen] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState<Job | null>(null);

  // Repost
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [repostJob, setRepostJob] = useState<Job | null>(null);

  // Payment
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentJob, setPaymentJob] = useState<Job | null>(null);

  // Cancel before sign
  const [cancelBeforeSignLoadingId, setCancelBeforeSignLoadingId] = useState<number | null>(null);
  const { huyTruocKy, isConnected, connect } = useWallet();

  const hasAccess = user?.roles?.includes("ROLE_EMPLOYER");

  // Delete job hook
  const deleteJob = useDeleteJob(async () => {
    await fetchJobs(jobFilter === "all" || isHistoryTab ? {} : { status: jobFilter as JobStatus });
  });

  // Auth redirects
  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push("/login");
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !hasAccess) router.push("/");
  }, [isHydrated, isAuthenticated, hasAccess, router]);

  // Data fetching
  useEffect(() => {
    if (isHydrated && isAuthenticated && hasAccess) {
      if (isHistoryTab) fetchJobs({ status: "IN_PROGRESS" as JobStatus });
      else if (isReviewTab) fetchJobs({ size: 1000 });
      else if (jobFilter === "all") fetchJobs({});
      else fetchJobs({ status: jobFilter as JobStatus });
    }
  }, [isHydrated, isAuthenticated, hasAccess, mainTab, jobFilter, fetchJobs, isHistoryTab, isReviewTab]);

  // Formatters
  const formatBudget = (budget?: number, currency?: string) => {
    if (!budget) return "Thương lượng";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: currency || "VND" }).format(budget);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chưa xác định";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatJobBudget = (job: Job) => formatBudget(job.budget, job.currency);

  // Handlers
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
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleReviewWork = (job: Job) => {
    setSelectedJobForReview(job);
    setWorkReviewDialogOpen(true);
  };

  const [toDraftLoadingId, setToDraftLoadingId] = useState<number | null>(null);
  const [toOpenLoadingId, setToOpenLoadingId] = useState<number | null>(null);

  const handleToDraft = async (job: Job) => {
    setToDraftLoadingId(job.id);
    try {
      const response = await api.toggleJobStatus(job.id);
      if (response.status === "SUCCESS") {
        toast.success("Đã chuyển công việc về Nháp");
        setJobFilter("DRAFT");
        await fetchJobs({ status: "DRAFT" as JobStatus });
      } else {
        toast.error(response.message || "Không thể chuyển trạng thái");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setToDraftLoadingId(null);
    }
  };

  const handleToOpen = async (job: Job) => {
    setToOpenLoadingId(job.id);
    try {
      const response = await api.toggleJobStatus(job.id);
      if (response.status === "SUCCESS") {
        toast.success("Đã công khai công việc");
        setJobFilter("OPEN");
        await fetchJobs({ status: "OPEN" as JobStatus });
      } else {
        toast.error(response.message || "Không thể chuyển trạng thái");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setToOpenLoadingId(null);
    }
  };

  const handleRepost = (job: Job) => {
    setRepostJob(job);
    setRepostDialogOpen(true);
  };

  const handleRepostSuccess = async () => {
    await fetchJobs(jobFilter === "all" ? {} : { status: jobFilter as JobStatus });
  };

  const handlePayment = (job: Job) => {
    setPaymentJob(job);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setJobFilter("OPEN");
    await fetchJobs({ status: "OPEN" as JobStatus });
  };

  const handleCancelBeforeSign = async (job: Job) => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví");
        return;
      }
    }

    if (!job.escrowId) {
      toast.error("Không tìm thấy thông tin escrow");
      return;
    }

    setCancelBeforeSignLoadingId(job.id);
    try {
      const txHash = await huyTruocKy(job.escrowId);
      if (!txHash) {
        throw new Error("Không thể hủy công việc");
      }

      const response = await api.cancelBeforeSign(job.id, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Đã hủy công việc và hoàn tiền");
        await fetchJobs(jobFilter === "all" ? {} : { status: jobFilter as JobStatus });
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error cancelling job:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi hủy công việc");
      }
    } finally {
      setCancelBeforeSignLoadingId(null);
    }
  };

  // Auth guards
  if (!isHydrated) {
    return <div className="flex-1 flex items-center justify-center"><JobsLoading /></div>;
  }

  if (!isAuthenticated || !user || !hasAccess) return null;

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

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex border-b border-gray-200">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMainTab(tab.key as "jobs" | "review" | "history");
                if (tab.key === "jobs") setJobFilter("all");
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                mainTab === tab.key
                  ? "text-[#00b14f] border-b-2 border-[#00b14f]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mainTab === "jobs" && (
          <div className="p-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Lọc:</span>
            {JOB_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setJobFilter(f.key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  jobFilter === f.key
                    ? "bg-[#00b14f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <JobsLoading />
      ) : isReviewTab ? (
        <ReviewTab jobs={jobs} formatBudget={formatBudget} />
      ) : isHistoryTab ? (
        <HistoryTab jobs={jobs} formatBudget={formatBudget} />
      ) : (
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
                onDelete={deleteJob.openDialog}
                onToDraft={handleToDraft}
                isToDraftLoading={toDraftLoadingId === job.id}
                onToOpen={handleToOpen}
                isToOpenLoading={toOpenLoadingId === job.id}
                onPayment={handlePayment}
                onRepost={handleRepost}
                onReviewWork={handleReviewWork}
                onCreateDispute={handleCreateDispute}
                onViewDispute={handleViewDispute}
                onViewHistory={handleHistoryClick}
                showHistoryButton={["IN_PROGRESS", "COMPLETED", "DISPUTED"].includes(job.status)}
                onCancelBeforeSign={handleCancelBeforeSign}
                isCancelBeforeSignLoading={cancelBeforeSignLoadingId === job.id}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!isHistoryTab && !isReviewTab && page && page.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page.first}
            onClick={() => fetchJobs({ 
              status: jobFilter === "all" ? undefined : jobFilter as JobStatus, 
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
              status: jobFilter === "all" ? undefined : jobFilter as JobStatus, 
              page: page.number + 1 
            })}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteJobDialog
        open={deleteJob.dialogOpen}
        onClose={deleteJob.closeDialog}
        job={deleteJob.jobToDelete}
        isDeleting={deleteJob.isDeleting}
        isConnected={deleteJob.isConnected}
        isConnecting={deleteJob.isConnecting}
        onConnect={deleteJob.handleConnect}
        onConfirm={deleteJob.confirmDelete}
      />

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
          <DialogHeader>
            <DialogTitle>Lịch sử hoạt động</DialogTitle>
            <DialogDescription>Xem các hoạt động liên quan đến công việc này</DialogDescription>
          </DialogHeader>
          {historyJobId && <JobHistoryTimeline jobId={historyJobId} />}
        </DialogContent>
      </Dialog>

      {/* Create Dispute Dialog */}
      {disputeJob && (
        <CreateDisputeDialog
          open={createDisputeDialogOpen}
          onOpenChange={setCreateDisputeDialogOpen}
          jobId={disputeJob.id}
          jobTitle={disputeJob.title}
          escrowId={disputeJob.escrowId}
          onSuccess={() => fetchJobs(jobFilter === "all" || isHistoryTab ? {} : { status: jobFilter as JobStatus })}
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
          escrowId={selectedJobForReview.escrowId}
          budget={selectedJobForReview.budget}
          currency={selectedJobForReview.currency}
          onSuccess={() => {
            if (jobFilter === "all" || isHistoryTab || isReviewTab) {
              fetchJobs(isReviewTab ? { status: "COMPLETED" as JobStatus } : {});
            } else {
              fetchJobs({ status: jobFilter as JobStatus });
            }
          }}
        />
      )}

      {/* Repost Job Dialog */}
      <RepostJobDialog
        job={repostJob}
        isOpen={repostDialogOpen}
        onClose={() => {
          setRepostDialogOpen(false);
          setRepostJob(null);
        }}
        onSuccess={handleRepostSuccess}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        job={paymentJob}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentJob(null);
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
