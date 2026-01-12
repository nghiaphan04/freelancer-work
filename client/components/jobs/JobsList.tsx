"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Job, Page } from "@/types/job";
import { api } from "@/lib/api";
import JobCardWithPreview from "./JobCardWithPreview";
import JobCategoriesSidebar from "./JobCategoriesSidebar";
import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";

const JOBS_PER_PAGE = 9;

export default function JobsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState<Page<Job> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const currentPage = parseInt(searchParams.get("page") || "0");
  const keyword = searchParams.get("keyword") || "";

  const fetchJobs = useCallback(async (pageNum: number = 0, search: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (search.trim()) {
        response = await api.searchJobs({ keyword: search, page: pageNum, size: JOBS_PER_PAGE });
      } else {
        response = await api.getOpenJobs({ page: pageNum, size: JOBS_PER_PAGE, sortBy: "createdAt", sortDir: "desc" });
      }
      
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
    setSearchKeyword(keyword);
    fetchJobs(currentPage, keyword);
  }, [currentPage, keyword, fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) {
      params.set("keyword", searchKeyword.trim());
    }
    params.set("page", "0");
    router.push(`/jobs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/jobs?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavorite = (jobId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(jobId)) {
        newFavorites.delete(jobId);
      } else {
        newFavorites.add(jobId);
      }
      return newFavorites;
    });
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
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm việc làm theo tên, kỹ năng..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/20 transition-all bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#00b14f] hover:bg-[#009643] text-white font-medium rounded-xl flex items-center gap-2 transition-colors"
          >
            <Icon name="search" size={20} />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </button>
        </div>
      </form>

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
          {!isLoading && page && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {keyword ? (
                  <>
                    Tìm thấy <span className="font-semibold text-[#00b14f]">{page.totalElements}</span> việc làm 
                    {keyword && <> cho từ khóa &quot;<span className="font-medium">{keyword}</span>&quot;</>}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-[#00b14f]">{page.totalElements}</span> việc làm đang tuyển
                  </>
                )}
              </p>
            </div>
          )}

          {/* Jobs Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Icon name="error_outline" size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchJobs(currentPage, keyword)}
                className="px-4 py-2 bg-[#00b14f] text-white rounded-lg hover:bg-[#009643] transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Icon name="work_off" size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Không tìm thấy việc làm</h3>
              <p className="text-gray-500">
                {keyword ? "Thử tìm kiếm với từ khóa khác" : "Hiện chưa có việc làm nào đang tuyển"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCardWithPreview
                    key={job.id}
                    job={job}
                    onFavorite={handleFavorite}
                    isFavorite={favorites.has(job.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
