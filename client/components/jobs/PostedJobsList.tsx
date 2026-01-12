"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePostedJobs } from "@/hooks/usePostedJobs";
import { JOB_STATUS_CONFIG } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

export default function PostedJobsList() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { jobs, isLoading, error, fetchJobs } = usePostedJobs();
  const [filter, setFilter] = useState<string>("all");

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
      fetchJobs(filter);
    }
  }, [isHydrated, isAuthenticated, hasAccess, filter, fetchJobs]);

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
    <div className="max-w-5xl mx-auto px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý công việc đã đăng</h1>
          <p className="text-gray-500 mt-1">Xem và quản lý các công việc bạn đã đăng tuyển</p>
        </div>
        <Button className="bg-[#00b14f] hover:bg-[#009643] w-full sm:w-auto">
          <Icon name="add" size={20} />
          Đăng việc mới
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex flex-wrap border-b border-gray-200">
          {[
            { key: "all", label: "Tất cả" },
            { key: "open", label: "Đang mở" },
            { key: "in_progress", label: "Đang thực hiện" },
            { key: "completed", label: "Hoàn thành" },
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
              <Button className="mt-4 bg-[#00b14f] hover:bg-[#009643]">
                <Icon name="add" size={20} />
                Đăng việc mới
              </Button>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-[#00b14f] cursor-pointer">
                        {job.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color || "bg-gray-100 text-gray-700"}`}>
                        {JOB_STATUS_CONFIG[job.status]?.label || job.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Icon name="payments" size={16} />
                        {job.budget}
                      </span>
                      {job.applicants !== undefined && (
                        <span className="flex items-center gap-1">
                          <Icon name="people" size={16} />
                          {job.applicants} ứng viên
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" size={16} />
                        Hạn: {new Date(job.deadline).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {job.freelancer && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Freelancer:</span> {job.freelancer.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Icon name="visibility" size={16} />
                      <span className="sm:hidden lg:inline">Xem chi tiết</span>
                    </Button>
                    {job.status === "open" && (
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-[#00b14f] border-[#00b14f]">
                        <Icon name="edit" size={16} />
                        <span className="sm:hidden lg:inline">Chỉnh sửa</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
