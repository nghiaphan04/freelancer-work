"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { JOB_STATUS_CONFIG } from "@/types/job";
import { api, JobApplication, ApplicationStatus, SavedJob, Dispute } from "@/lib/api";
import JobsLoading from "../shared/JobsLoading";
import JobsEmptyState from "../shared/JobsEmptyState";
import JobsSearchBar from "../shared/JobsSearchBar";
import JobsPageHeader from "../shared/JobsPageHeader";
import JobHistoryTimeline from "../shared/JobHistoryTimeline";
import { DisputeResponseDialog } from "../dispute/DisputeDialog";
import { WorkSubmitDialog } from "../work/WorkDialogs";
import FreelancerJobCard from "./accepted/FreelancerJobCard";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [filter, setFilter] = useState<string>("all");

  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [historyJobId, setHistoryJobId] = useState<number | null>(null);
  
  // Dispute states
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);

  // Work submission states
  const [workSubmitDialogOpen, setWorkSubmitDialogOpen] = useState(false);
  const [selectedJobForWork, setSelectedJobForWork] = useState<{ id: number; title: string } | null>(null);

  // Withdraw application states
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedAppToWithdraw, setSelectedAppToWithdraw] = useState<JobApplication | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const hasAccess = user?.roles?.includes("ROLE_FREELANCER");
  const isAppliedTab = filter === "applied";
  const isSavedTab = filter === "saved";
  const isHistoryTab = filter === "history";
  const isSubmittedTab = filter === "submitted";

  const filteredApplications = applications.filter((app) =>
    searchKeyword.trim() === "" || app.jobTitle.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const filteredSavedJobs = savedJobs.filter((job) =>
    searchKeyword.trim() === "" || job.jobTitle.toLowerCase().includes(searchKeyword.toLowerCase())
  );

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
      if (isAppliedTab) {
        fetchApplications();
      } else if (isSavedTab) {
        fetchSavedJobs();
      } else if (isHistoryTab) {
        // Tab lịch sử: lấy job IN_PROGRESS và COMPLETED
        fetchJobs("IN_PROGRESS");
      } else if (isSubmittedTab) {
        // Tab đã nộp: lấy jobs IN_PROGRESS có workStatus là SUBMITTED hoặc APPROVED
        fetchJobs("IN_PROGRESS");
      } else {
        fetchJobs(filter);
        fetchStats();
      }
    }
  }, [isHydrated, isAuthenticated, hasAccess, filter, fetchJobs, fetchStats, isAppliedTab, isSavedTab, isHistoryTab, isSubmittedTab]);

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await api.getMyApplications({ size: 100 });
      if (res.status === "SUCCESS" && res.data) {
        setApplications(res.data.content);
      }
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
      if (res.status === "SUCCESS" && res.data) {
        setSavedJobs(res.data.content);
      }
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
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
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
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleSubmitWork = (job: { id: number; title: string }) => {
    setSelectedJobForWork(job);
    setWorkSubmitDialogOpen(true);
  };

  const handleWithdrawClick = (app: JobApplication) => {
    setSelectedAppToWithdraw(app);
    setWithdrawDialogOpen(true);
  };

  const executeWithdraw = async () => {
    if (!selectedAppToWithdraw) return;
    
    setWithdrawLoading(true);
    try {
      const res = await api.withdrawApplication(selectedAppToWithdraw.id);
      if (res.status === "SUCCESS") {
        toast.success("Đã rút đơn ứng tuyển thành công");
        setApplications((apps) =>
          apps.map((a) =>
            a.id === selectedAppToWithdraw.id
              ? { ...a, status: "WITHDRAWN" as ApplicationStatus }
              : a
          )
        );
        setWithdrawDialogOpen(false);
      } else {
        toast.error(res.message || "Không thể rút đơn");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setWithdrawLoading(false);
      setSelectedAppToWithdraw(null);
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
        title="Quản lý công việc đã nhận" 
        subtitle="Theo dõi và cập nhật tiến độ các công việc của bạn"
      >
        <Link href="/jobs">
          <Button 
            variant="outline" 
            className="border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f] hover:text-white w-full sm:w-auto"
          >
            <Icon name="search" size={20} />
            Tìm việc mới
          </Button>
        </Link>
      </JobsPageHeader>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex flex-wrap border-b border-gray-200">
          {[
            { key: "all", label: "Tất cả" },
            { key: "IN_PROGRESS", label: "Đang làm" },
            { key: "submitted", label: "Đã nộp" },
            { key: "DISPUTED", label: "Tranh chấp" },
            { key: "COMPLETED", label: "Hoàn thành" },
            { key: "applied", label: "Đã ứng tuyển" },
            { key: "saved", label: "Đã lưu" },
            { key: "history", label: "Lịch sử" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
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

      {isSavedTab ? (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <JobsSearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm kiếm trong công việc đã lưu..."
            />
          </div>

          {/* Results Info */}
          {!savedJobsLoading && (
            <p className="text-gray-600 mb-4">
              {searchKeyword ? (
                <>
                  Tìm thấy <span className="font-semibold text-[#00b14f]">{filteredSavedJobs.length}</span> kết quả
                  cho &quot;<span className="font-medium">{searchKeyword}</span>&quot;
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#00b14f]">{savedJobs.length}</span> công việc đã lưu
                </>
              )}
            </p>
          )}

          {/* Loading State */}
          {savedJobsLoading ? (
            <JobsLoading />
          ) : (
            /* Saved Jobs List */
            <div className="space-y-4">
              {filteredSavedJobs.length === 0 ? (
                <JobsEmptyState
                  icon="bookmark_border"
                  message={searchKeyword ? "Không tìm thấy kết quả" : "Chưa lưu công việc nào"}
                >
                  <Link href="/jobs">
                    <Button className="mt-4 bg-[#00b14f] hover:bg-[#009643]">
                      <Icon name="search" size={16} />
                      Tìm việc ngay
                    </Button>
                  </Link>
                </JobsEmptyState>
              ) : (
                filteredSavedJobs.map((savedJob) => (
                  <div key={savedJob.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Employer Avatar */}
                      <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
                        <AvatarImage src={savedJob.employer.avatarUrl} alt={savedJob.employer.fullName} />
                        <AvatarFallback className="bg-[#00b14f] text-white">
                          {savedJob.employer.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Link href={`/jobs/${savedJob.jobId}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer">
                              {savedJob.jobTitle}
                            </h3>
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                            savedJob.jobStatus === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {savedJob.jobStatus === "OPEN" ? "Đang tuyển" : savedJob.jobStatus}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {savedJob.employer.company || savedJob.employer.fullName}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1 text-[#00b14f] font-medium">
                            <Icon name="payments" size={16} />
                            {savedJob.jobBudget ? `${savedJob.jobBudget.toLocaleString("vi-VN")} VND` : "Thương lượng"}
                          </span>
                          {savedJob.employer.location && (
                            <span className="flex items-center gap-1">
                              <Icon name="location_on" size={16} />
                              {savedJob.employer.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Icon name="schedule" size={16} />
                            Lưu: {new Date(savedJob.savedAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        {/* Skills */}
                        {savedJob.jobSkills && savedJob.jobSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {savedJob.jobSkills.slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {savedJob.jobSkills.length > 4 && (
                              <span className="px-2 py-0.5 text-gray-500 text-xs">
                                +{savedJob.jobSkills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <Link href={`/jobs/${savedJob.jobId}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Icon name="visibility" size={16} />
                            <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-600"
                          onClick={() => handleUnsaveJob(savedJob.jobId)}
                        >
                          <Icon name="bookmark_remove" size={16} />
                          <span className="sm:hidden lg:inline ml-1">Bỏ lưu</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : isHistoryTab ? (
        /* History Tab Content */
        <div className="space-y-3">
          {isLoading ? (
            <JobsLoading />
          ) : jobs.filter(j => j.status === "IN_PROGRESS" || j.status === "COMPLETED").length === 0 ? (
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
                      <p className="text-sm text-gray-500">
                        {job.employer?.fullName} • {job.budget?.toLocaleString("vi-VN")} {job.currency}
                      </p>
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
      ) : isAppliedTab ? (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <JobsSearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm kiếm theo tên công việc..."
            />
          </div>

          {/* Results Info */}
          {!applicationsLoading && (
            <p className="text-gray-600 mb-4">
              {searchKeyword ? (
                <>
                  Tìm thấy <span className="font-semibold text-[#00b14f]">{filteredApplications.length}</span> kết quả
                  cho &quot;<span className="font-medium">{searchKeyword}</span>&quot;
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#00b14f]">{applications.length}</span> đơn ứng tuyển
                </>
              )}
            </p>
          )}

          {/* Loading State */}
          {applicationsLoading ? (
            <JobsLoading />
          ) : (
            /* Applications List */
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <JobsEmptyState
                  icon="send"
                  message={searchKeyword ? "Không tìm thấy kết quả" : "Chưa ứng tuyển công việc nào"}
                />
              ) : (
                filteredApplications.map((app) => (
                  <div key={app.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Link href={`/jobs/${app.jobId}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer">
                              {app.jobTitle}
                            </h3>
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${APPLICATION_STATUS_CONFIG[app.status]?.color}`}>
                            {APPLICATION_STATUS_CONFIG[app.status]?.label}
                          </span>
                        </div>

                        {app.coverLetter && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{app.coverLetter}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Icon name="schedule" size={16} />
                            Ứng tuyển: {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <Link href={`/jobs/${app.jobId}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Icon name="visibility" size={16} />
                            <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
                          </Button>
                        </Link>
                        {app.status === "PENDING" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-600"
                            onClick={() => handleWithdrawClick(app)}
                          >
                            <Icon name="undo" size={16} />
                            <span className="sm:hidden lg:inline ml-1">Rút đơn</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Stats Summary */}
          {stats && (
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
          )}

          {/* Error State */}
          {error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <JobsLoading />
          ) : (
            /* Job List */
            <div className="space-y-4">
              {(() => {
                const displayJobs = isSubmittedTab
                  ? jobs.filter(
                      (job) =>
                        job.workStatus === "SUBMITTED" ||
                        job.workStatus === "APPROVED" ||
                        Boolean(job.workSubmissionUrl)
                    )
                  : jobs;

                return displayJobs.length === 0 ? (
                  <JobsEmptyState
                    message={
                      isSubmittedTab ? "Chưa có sản phẩm nào được nộp" : "Không có công việc nào"
                    }
                  />
                ) : (
                  displayJobs.map((job) => (
                    <FreelancerJobCard
                      key={job.id}
                      job={job}
                      onSubmitWork={handleSubmitWork}
                      onViewDispute={handleViewDispute}
                    />
                  ))
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Dispute Response Dialog */}
      {currentDispute && (
        <DisputeResponseDialog
          open={disputeDialogOpen}
          onOpenChange={setDisputeDialogOpen}
          dispute={currentDispute}
          onSuccess={() => {
            fetchJobs(filter);
          }}
        />
      )}

      {/* Work Submit Dialog */}
      {selectedJobForWork && (
        <WorkSubmitDialog
          open={workSubmitDialogOpen}
          onOpenChange={setWorkSubmitDialogOpen}
          jobId={selectedJobForWork.id}
          jobTitle={selectedJobForWork.title}
          onSuccess={() => {
            // Refresh jobs after submission - always fetch IN_PROGRESS để lấy workStatus mới
            fetchJobs("IN_PROGRESS");
            fetchStats();
            setSelectedJobForWork(null);
          }}
        />
      )}

      {/* Withdraw Application Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={(open) => !withdrawLoading && setWithdrawDialogOpen(open)}>
        <DialogContent
          onPointerDownOutside={(e) => withdrawLoading && e.preventDefault()}
          onEscapeKeyDown={(e) => withdrawLoading && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Rút đơn ứng tuyển</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn rút đơn ứng tuyển cho công việc &quot;{selectedAppToWithdraw?.jobTitle}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-600 flex items-start gap-2">
              <Icon name="info" size={18} className="shrink-0 mt-0.5" />
              <span>Sau khi rút đơn, bạn có thể ứng tuyển lại nhưng sẽ mất thêm 1 credit.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)} disabled={withdrawLoading}>
              Hủy
            </Button>
            <Button
              onClick={executeWithdraw}
              disabled={withdrawLoading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {withdrawLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Rút đơn"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
