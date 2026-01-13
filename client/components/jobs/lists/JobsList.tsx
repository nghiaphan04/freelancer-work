"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Job, Page } from "@/types/job";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import JobCardWithPreview from "../cards/JobCardWithPreview";
import JobCategoriesSidebar from "../sidebar/JobCategoriesSidebar";
import JobsSearchBar from "../shared/JobsSearchBar";
import JobsEmptyState from "../shared/JobsEmptyState";
import JobsError from "../shared/JobsError";
import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const JOBS_PER_PAGE = 9;

export default function JobsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState<Page<Job> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const currentPage = parseInt(searchParams.get("page") || "0");

  const fetchSavedJobIds = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.getSavedJobIds();
      if (response.status === "SUCCESS" && response.data) {
        setFavorites(new Set(response.data));
      }
    } catch {
    }
  }, [isAuthenticated]);

  const fetchJobs = useCallback(async (pageNum: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getOpenJobs({ page: pageNum, size: JOBS_PER_PAGE, sortBy: "createdAt", sortDir: "desc" });
      
      if (response.status === "SUCCESS" && response.data) {
        setJobs(response.data.content);
        setPage(response.data);
      } else {
        setError(response.message || "Không thể tải danh sách việc làm");
      }
    } catch {
      setError("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(currentPage);
    fetchSavedJobIds();
  }, [currentPage, fetchJobs, fetchSavedJobIds]);

  // Filter jobs by search keyword (client-side)
  const filteredJobs = jobs.filter((job) =>
    searchKeyword.trim() === "" ||
    job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    job.skills?.some((skill) => skill.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/jobs?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavorite = async (jobId: number) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu công việc");
      router.push("/login");
      return;
    }

    const isSaved = favorites.has(jobId);
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (isSaved) {
        newFavorites.delete(jobId);
      } else {
        newFavorites.add(jobId);
      }
      return newFavorites;
    });

    try {
      const response = await api.toggleSaveJob(jobId);
      if (response.status === "SUCCESS") {
        toast.success(isSaved ? "Đã bỏ lưu công việc" : "Đã lưu công việc");
      } else {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (isSaved) {
            newFavorites.add(jobId);
          } else {
            newFavorites.delete(jobId);
          }
          return newFavorites;
        });
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch {
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (isSaved) {
          newFavorites.add(jobId);
        } else {
          newFavorites.delete(jobId);
        }
        return newFavorites;
      });
      toast.error("Có lỗi xảy ra khi lưu công việc");
    }
  };

  const renderPagination = () => {
    if (!page || page.totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const totalPages = page.totalPages;
    const current = page.number;

    pages.push(0);

    if (current > 2) {
      pages.push("...");
    }

    for (let i = Math.max(1, current - 1); i <= Math.min(totalPages - 2, current + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (current < totalPages - 3) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages - 1);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={page.first}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="chevron_left" size={20} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            typeof p === "string" ? (
              <span key={idx} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={idx}
                onClick={() => handlePageChange(p)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  p === current
                    ? "bg-[#00b14f] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p + 1}
              </button>
            )
          )}
        </div>

        <span className="text-gray-500 mx-2">/ {page.totalPages} trang</span>

        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={page.last}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="chevron_right" size={20} className="text-gray-600" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Search Bar */}
      <div className="mb-6">
        <JobsSearchBar
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="Tìm kiếm việc làm theo tên, kỹ năng..."
        />
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar - Hidden on mobile/tablet */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-20 z-50">
            <JobCategoriesSidebar />
          </div>
        </div>

        {/* Jobs Content */}
        <div className="flex-1 min-w-0">
          {/* Results Info */}
          {!isLoading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {searchKeyword ? (
                  <>
                    Tìm thấy <span className="font-semibold text-[#00b14f]">{filteredJobs.length}</span> việc làm 
                    cho &quot;<span className="font-medium">{searchKeyword}</span>&quot;
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-[#00b14f]">{page?.totalElements || 0}</span> việc làm đang tuyển
                  </>
                )}
              </p>
            </div>
          )}

          {/* Jobs Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <Skeleton className="w-14 h-14 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <JobsError message={error} onRetry={() => fetchJobs(currentPage)} />
          ) : filteredJobs.length === 0 ? (
            <JobsEmptyState
              title="Không tìm thấy việc làm"
              message={searchKeyword ? "Thử tìm kiếm với từ khóa khác" : "Hiện chưa có việc làm nào đang tuyển"}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredJobs.map((job) => (
                  <JobCardWithPreview
                    key={job.id}
                    job={job}
                    onFavorite={handleFavorite}
                    isFavorite={favorites.has(job.id)}
                  />
                ))}
              </div>

              {/* Pagination - only show when not filtering */}
              {!searchKeyword && renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
