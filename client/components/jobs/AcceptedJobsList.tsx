"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { JOB_STATUS_CONFIG } from "@/types/job";
import { api, JobApplication, ApplicationStatus } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "Đã chấp nhận", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-100 text-red-700" },
  WITHDRAWN: { label: "Đã rút", color: "bg-gray-100 text-gray-700" },
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

  const hasAccess = user?.roles?.includes("ROLE_FREELANCER");
  const isAppliedTab = filter === "applied";

  // Filter applications by search keyword
  const filteredApplications = applications.filter((app) =>
    searchKeyword.trim() === "" || app.jobTitle.toLowerCase().includes(searchKeyword.toLowerCase())
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
      } else {
        fetchJobs(filter);
        fetchStats();
      }
    }
  }, [isHydrated, isAuthenticated, hasAccess, filter, fetchJobs, fetchStats]);

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

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return amount.toLocaleString("vi-VN");
  };

  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !hasAccess) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý công việc đã nhận</h1>
          <p className="text-gray-500 mt-1">Theo dõi và cập nhật tiến độ các công việc của bạn</p>
        </div>
        <Link href="/jobs">
          <Button 
            variant="outline" 
            className="border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f] hover:text-white w-full sm:w-auto"
          >
            <Icon name="search" size={20} />
            Tìm việc mới
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex flex-wrap border-b border-gray-200">
          {[
            { key: "all", label: "Tất cả" },
            { key: "IN_PROGRESS", label: "Đang làm" },
            { key: "PENDING_REVIEW", label: "Chờ nghiệm thu" },
            { key: "COMPLETED", label: "Hoàn thành" },
            { key: "applied", label: "Đã ứng tuyển" },
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

      {isAppliedTab ? (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm theo tên công việc..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/20 transition-all bg-white"
              />
            </div>
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
            <div className="bg-white rounded-lg shadow p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            /* Applications List */
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Icon name="send" size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchKeyword ? "Không tìm thấy kết quả" : "Chưa ứng tuyển công việc nào"}
                  </p>
                </div>
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
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon name="pending_actions" size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                    <p className="text-xs text-gray-500">Đang làm</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Icon name="hourglass_top" size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                    <p className="text-xs text-gray-500">Chờ duyệt</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="check_circle" size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                    <p className="text-xs text-gray-500">Hoàn thành</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00b14f]/10 flex items-center justify-center">
                    <Icon name="payments" size={20} className="text-[#00b14f]" />
                  </div>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            /* Job List */
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Icon name="work_off" size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không có công việc nào</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Employer Info */}
                      {job.employer && (
                        <Avatar className="w-12 h-12 shrink-0 hidden sm:flex">
                          <AvatarImage src={job.employer.avatarUrl} alt={job.employer.fullName} />
                          <AvatarFallback className="bg-[#00b14f] text-white">
                            {job.employer.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer truncate">
                            {job.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${JOB_STATUS_CONFIG[job.status]?.color || "bg-gray-100 text-gray-700"}`}>
                            {JOB_STATUS_CONFIG[job.status]?.label || job.status}
                          </span>
                        </div>

                        {job.employer && (
                          <p className="text-sm text-gray-600 mb-2">{job.employer.fullName}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Icon name="payments" size={16} />
                            {job.budget ? `${job.budget.toLocaleString("vi-VN")} ${job.currency}` : "Thương lượng"}
                          </span>
                          {job.expectedStartDate && (
                            <span className="flex items-center gap-1">
                              <Icon name="event" size={16} />
                              Bắt đầu: {new Date(job.expectedStartDate).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                          {job.applicationDeadline && (
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={16} />
                              Hạn: {new Date(job.applicationDeadline).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Icon name="visibility" size={16} />
                            <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
                          </Button>
                        </Link>
                        {job.status === "IN_PROGRESS" && (
                          <Button size="sm" className="bg-[#00b14f] hover:bg-[#009643]">
                            <Icon name="upload" size={16} />
                            <span className="sm:hidden lg:inline ml-1">Nộp bài</span>
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
      )}
    </div>
  );
}
