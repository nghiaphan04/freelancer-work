"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { api, JobApplication, ApplicationStatus, SavedJob, Dispute } from "@/lib/api";
import JobsLoading from "../../shared/JobsLoading";
import JobsEmptyState from "../../shared/JobsEmptyState";
import JobsSearchBar from "../../shared/JobsSearchBar";
import JobsPageHeader from "../../shared/JobsPageHeader";
import { DisputeResponseDialog } from "../../dispute/DisputeDialog";
import { WorkSubmitDialog } from "../../work/WorkDialogs";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WalletAvatar from "@/components/ui/WalletAvatar";
import { toast } from "sonner";

// Hooks
import { useJobWithdraw } from "@/hooks/useJobWithdraw";
import { useApplicationWithdraw } from "@/hooks/useApplicationWithdraw";

// Dialogs
import JobWithdrawDialog from "./dialogs/JobWithdrawDialog";
import WithdrawApplicationDialog from "./dialogs/WithdrawApplicationDialog";

import FreelancerJobCard from "./FreelancerJobCard";

// Tabs
import SubmittedTab from "./tabs/SubmittedTab";
import HistoryTab from "./tabs/HistoryTab";

const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-gray-100 text-gray-600" },
  ACCEPTED: { label: "Đã chấp nhận", color: "bg-gray-100 text-gray-600" },
  REJECTED: { label: "Bị từ chối", color: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Đã rút", color: "bg-gray-100 text-gray-600" },
};

export default function AcceptedJobsList() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { jobs, stats, isLoading, error, fetchJobs, fetchStats } = useAcceptedJobs();

  // Tab state
  const [mainTab, setMainTab] = useState<"jobs" | "submitted" | "history">("jobs");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Applications & Saved Jobs
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);

  // Dispute
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);

  // Work Submit
  const [workSubmitDialogOpen, setWorkSubmitDialogOpen] = useState(false);
  const [selectedJobForWork, setSelectedJobForWork] = useState<{ id: number; title: string; escrowId?: number } | null>(null);

  const hasAccess = user?.roles?.includes("ROLE_FREELANCER");
  
  const isAppliedTab = mainTab === "jobs" && jobFilter === "applied";
  const isSavedTab = mainTab === "jobs" && jobFilter === "saved";
  const isHistoryTab = mainTab === "history";
  const isSubmittedTab = mainTab === "submitted";

  // Custom hooks for dialogs
  const jobWithdraw = useJobWithdraw(() => fetchJobs(jobFilter === "all" ? "all" : jobFilter));
  const appWithdraw = useApplicationWithdraw((appId) => {
    setApplications((apps) =>
      apps.map((a) => a.id === appId ? { ...a, status: "WITHDRAWN" as ApplicationStatus } : a)
    );
  });

  // Filtered data
  const filteredApplications = applications.filter((app) =>
    searchKeyword.trim() === "" || app.jobTitle.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const filteredSavedJobs = savedJobs.filter((job) =>
    searchKeyword.trim() === "" || job.jobTitle.toLowerCase().includes(searchKeyword.toLowerCase())
  );

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
      if (isSubmittedTab) fetchJobs("all");
      else if (isHistoryTab) fetchJobs("IN_PROGRESS");
      else if (isAppliedTab) fetchApplications();
      else if (isSavedTab) fetchSavedJobs();
      else {
        fetchJobs(jobFilter === "all" ? "all" : jobFilter);
        fetchStats();
      }
    }
  }, [isHydrated, isAuthenticated, hasAccess, mainTab, jobFilter, fetchJobs, fetchStats, isAppliedTab, isSavedTab, isHistoryTab, isSubmittedTab]);

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await api.getMyApplications({ size: 100 });
      if (res.status === "SUCCESS" && res.data) setApplications(res.data.content);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchSavedJobs = useCallback(async () => {
    setSavedJobsLoading(true);
    try {
      const res = await api.getSavedJobs({ size: 100 });
      if (res.status === "SUCCESS" && res.data) setSavedJobs(res.data.content);
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
    } finally {
      setSavedJobsLoading(false);
    }
  }, []);

  const handleUnsaveJob = async (jobId: number) => {
    try {
      const res = await api.unsaveJob(jobId);
      if (res.status === "SUCCESS") {
        setSavedJobs((prev) => prev.filter((job) => job.jobId !== jobId));
        toast.success("Đã bỏ lưu công việc");
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi bỏ lưu công việc");
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return amount.toLocaleString("vi-VN");
  };

  const handleViewDispute = async (jobId: number) => {
    try {
      const response = await api.getDispute(jobId);
      if (response.status === "SUCCESS" && response.data) {
        setCurrentDispute(response.data);
        setDisputeDialogOpen(true);
      } else {
        toast.error("Không tìm thấy thông tin khiếu nại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleSubmitWork = (job: { id: number; title: string; escrowId?: number }) => {
    setSelectedJobForWork(job);
    setWorkSubmitDialogOpen(true);
  };

  if (!isHydrated) {
    return <div className="flex-1 flex items-center justify-center"><JobsLoading /></div>;
  }

  if (!isAuthenticated || !user || !hasAccess) return null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Page Header */}
      <JobsPageHeader title="Quản lý các hợp đồng" subtitle="Theo dõi và cập nhật tiến độ các công việc của bạn">
        <Link href="/jobs">
          <Button variant="outline" className="border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f] hover:text-white w-full sm:w-auto">
            <Icon name="search" size={20} />
            Tìm việc mới
          </Button>
        </Link>
      </JobsPageHeader>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex border-b border-gray-200">
          {[
            { key: "jobs", label: "Công việc" },
            { key: "submitted", label: "Sản phẩm đã nghiệm thu" },
            { key: "history", label: "Lịch sử" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMainTab(tab.key as "jobs" | "submitted" | "history");
                if (tab.key === "jobs") setJobFilter("all");
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
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
            {[
              { key: "all", label: "Tất cả" },
              { key: "PENDING_SIGNATURE", label: "Chờ ký" },
              { key: "IN_PROGRESS", label: "Đang làm" },
              { key: "DISPUTED", label: "Tranh chấp" },
              { key: "COMPLETED", label: "Hoàn thành" },
              { key: "applied", label: "Đã ứng tuyển" },
              { key: "saved", label: "Đã lưu" },
            ].map((f) => (
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

      {/* Tab Content */}
      {isSubmittedTab ? (
        <SubmittedTab jobs={jobs} isLoading={isLoading} />
      ) : isHistoryTab ? (
        <HistoryTab jobs={jobs} isLoading={isLoading} />
      ) : (
        <JobsTabContent
          jobFilter={jobFilter}
          isAppliedTab={isAppliedTab}
          isSavedTab={isSavedTab}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          applications={filteredApplications}
          applicationsLoading={applicationsLoading}
          savedJobs={filteredSavedJobs}
          savedJobsLoading={savedJobsLoading}
          jobs={jobs}
          stats={stats}
          isLoading={isLoading}
          error={error}
          formatCurrency={formatCurrency}
          onUnsaveJob={handleUnsaveJob}
          onWithdrawApp={appWithdraw.openDialog}
          onSubmitWork={handleSubmitWork}
          onViewDispute={handleViewDispute}
          onRequestWithdraw={jobWithdraw.openDialog}
          onSignSuccess={() => fetchJobs(jobFilter === "all" ? "all" : jobFilter)}
        />
      )}

      {/* Dialogs */}
      {currentDispute && (
        <DisputeResponseDialog
          open={disputeDialogOpen}
          onOpenChange={setDisputeDialogOpen}
          dispute={currentDispute}
          onSuccess={() => fetchJobs(jobFilter === "all" ? "all" : jobFilter)}
        />
      )}

      {selectedJobForWork && (
        <WorkSubmitDialog
          open={workSubmitDialogOpen}
          onOpenChange={setWorkSubmitDialogOpen}
          jobId={selectedJobForWork.id}
          jobTitle={selectedJobForWork.title}
          escrowId={selectedJobForWork.escrowId}
          onSuccess={() => {
            fetchJobs("IN_PROGRESS");
            fetchStats();
            setSelectedJobForWork(null);
          }}
        />
      )}

      <WithdrawApplicationDialog
        open={appWithdraw.dialogOpen}
        onClose={appWithdraw.closeDialog}
        jobTitle={appWithdraw.selectedApp?.jobTitle}
        isLoading={appWithdraw.isLoading}
        onWithdraw={appWithdraw.withdraw}
      />

      <JobWithdrawDialog
        open={jobWithdraw.dialogOpen}
        onClose={jobWithdraw.closeDialog}
        jobTitle={jobWithdraw.selectedJob?.title}
        reason={jobWithdraw.reason}
        onReasonChange={jobWithdraw.setReason}
        isLoading={jobWithdraw.isLoading}
        isConnected={jobWithdraw.isConnected}
        isConnecting={jobWithdraw.isConnecting}
        onConnect={jobWithdraw.connect}
        onWithdraw={jobWithdraw.withdraw}
        penaltyAmount={jobWithdraw.penaltyAmount}
      />
    </div>
  );
}

// Sub-component for Jobs Tab Content
interface JobsTabContentProps {
  jobFilter: string;
  isAppliedTab: boolean;
  isSavedTab: boolean;
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  applications: JobApplication[];
  applicationsLoading: boolean;
  savedJobs: SavedJob[];
  savedJobsLoading: boolean;
  jobs: any[];
  stats: any;
  isLoading: boolean;
  error: string | null;
  formatCurrency: (n: number) => string;
  onUnsaveJob: (id: number) => void;
  onWithdrawApp: (app: JobApplication) => void;
  onSubmitWork: (job: any) => void;
  onViewDispute: (id: number) => void;
  onRequestWithdraw: (job: any) => void;
  onSignSuccess: () => void;
}

function JobsTabContent({
  jobFilter, isAppliedTab, isSavedTab, searchKeyword, setSearchKeyword,
  applications, applicationsLoading, savedJobs, savedJobsLoading,
  jobs, stats, isLoading, error, formatCurrency,
  onUnsaveJob, onWithdrawApp, onSubmitWork, onViewDispute, onRequestWithdraw, onSignSuccess,
}: JobsTabContentProps) {
  if (isSavedTab) {
    return (
      <>
        <div className="mb-4">
          <JobsSearchBar value={searchKeyword} onChange={setSearchKeyword} placeholder="Tìm kiếm trong công việc đã lưu..." />
        </div>
        {!savedJobsLoading && (
          <p className="text-gray-600 mb-4">
            <span className="font-semibold text-[#00b14f]">{savedJobs.length}</span> công việc đã lưu
          </p>
        )}
        {savedJobsLoading ? <JobsLoading /> : savedJobs.length === 0 ? (
          <JobsEmptyState icon="bookmark_border" message="Chưa lưu công việc nào">
            <Link href="/jobs"><Button className="mt-4 bg-[#00b14f] hover:bg-[#009643]"><Icon name="search" size={16} />Tìm việc ngay</Button></Link>
          </JobsEmptyState>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((savedJob) => (
              <SavedJobCard key={savedJob.id} job={savedJob} onUnsave={onUnsaveJob} />
            ))}
          </div>
        )}
      </>
    );
  }

  if (isAppliedTab) {
    return (
      <>
        <div className="mb-4">
          <JobsSearchBar value={searchKeyword} onChange={setSearchKeyword} placeholder="Tìm kiếm theo tên công việc..." />
        </div>
        {!applicationsLoading && (
          <p className="text-gray-600 mb-4">
            <span className="font-semibold text-[#00b14f]">{applications.length}</span> đơn ứng tuyển
          </p>
        )}
        {applicationsLoading ? <JobsLoading /> : applications.length === 0 ? (
          <JobsEmptyState icon="send" message="Chưa ứng tuyển công việc nào" />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} onWithdraw={onWithdrawApp} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {stats && jobFilter === "all" && <StatsGrid stats={stats} formatCurrency={formatCurrency} />}
      {error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      )}
      {isLoading ? <JobsLoading /> : (
        <div className="space-y-4">
          {jobs.length === 0 ? <JobsEmptyState message="Không có công việc nào" /> : jobs.map((job) => (
            <FreelancerJobCard
              key={job.id}
              job={job}
              onSubmitWork={onSubmitWork}
              onViewDispute={onViewDispute}
              onRequestWithdraw={onRequestWithdraw}
              onSignSuccess={onSignSuccess}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Stats Grid Component
function StatsGrid({ stats, formatCurrency }: { stats: any; formatCurrency: (n: number) => string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <Icon name="pending_actions" size={24} className="text-gray-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">Đang làm</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <Icon name="gavel" size={24} className="text-gray-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.disputed}</p>
            <p className="text-xs text-gray-500">Tranh chấp</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <Icon name="check_circle" size={24} className="text-green-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-xs text-gray-500">Hoàn thành</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <Icon name="payments" size={24} className="text-[#00b14f]" />
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
            <p className="text-xs text-gray-500">Tổng thu nhập</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Saved Job Card
function SavedJobCard({ job, onUnsave }: { job: SavedJob; onUnsave: (id: number) => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {job.employer.avatarUrl ? (
          <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
            <AvatarImage src={job.employer.avatarUrl} alt={job.employer.fullName} />
            <AvatarFallback className="bg-[#00b14f] text-white">{job.employer.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : job.employer.walletAddress ? (
          <WalletAvatar address={job.employer.walletAddress} size={48} className="shrink-0 hidden sm:flex" />
        ) : (
          <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
            <AvatarFallback className="bg-[#00b14f] text-white">{job.employer.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link href={`/jobs/${job.jobId}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer">{job.jobTitle}</h3>
            </Link>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${job.jobStatus === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
              {job.jobStatus === "OPEN" ? "Đang tuyển" : job.jobStatus}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{job.employer.company || job.employer.fullName}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1 text-[#00b14f] font-medium">
              <Icon name="payments" size={16} />
              {job.jobBudget ? `${job.jobBudget} APT` : "Thương lượng"}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="schedule" size={16} />
              Lưu: {new Date(job.savedAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          <Link href={`/jobs/${job.jobId}`}>
            <Button variant="outline" size="sm" className="w-full"><Icon name="visibility" size={16} /><span className="sm:hidden lg:inline ml-1">Chi tiết</span></Button>
          </Link>
          <Button variant="outline" size="sm" className="w-full text-gray-500" onClick={() => onUnsave(job.jobId)}>
            <Icon name="bookmark_remove" size={16} /><span className="sm:hidden lg:inline ml-1">Bỏ lưu</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Application Card
function ApplicationCard({ app, onWithdraw }: { app: JobApplication; onWithdraw: (app: JobApplication) => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link href={`/jobs/${app.jobId}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer">{app.jobTitle}</h3>
            </Link>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${APPLICATION_STATUS_CONFIG[app.status]?.color}`}>
              {APPLICATION_STATUS_CONFIG[app.status]?.label}
            </span>
          </div>
          {app.coverLetter && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{app.coverLetter}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Icon name="schedule" size={16} />
              Ứng tuyển: {new Date(app.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          <Link href={`/jobs/${app.jobId}`}>
            <Button variant="outline" size="sm" className="w-full"><Icon name="visibility" size={16} /><span className="sm:hidden lg:inline ml-1">Chi tiết</span></Button>
          </Link>
          {app.status === "PENDING" && (
            <Button variant="outline" size="sm" className="w-full text-gray-500" onClick={() => onWithdraw(app)}>
              <Icon name="undo" size={16} /><span className="sm:hidden lg:inline ml-1">Rút đơn</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
