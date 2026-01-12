"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { usePostedJobs } from "@/hooks/usePostedJobs";
import { api } from "@/lib/api";
import { JOB_STATUS_CONFIG, JobStatus, Job } from "@/types/job";
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

const FILTER_TABS: { key: JobStatus | "all"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "DRAFT", label: "Bản nháp" },
  { key: "OPEN", label: "Đang tuyển" },
  { key: "IN_PROGRESS", label: "Đang thực hiện" },
  { key: "COMPLETED", label: "Hoàn thành" },
];

export default function PostedJobsList() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { jobs, page, isLoading, error, fetchJobs } = usePostedJobs();
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingDeleteId, setLoadingDeleteId] = useState<number | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{ hasPaidPayment: boolean } | null>(null);

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
      fetchJobs(filter === "all" ? {} : { status: filter });
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

  const handleDeleteClick = async (job: Job) => {
    setLoadingDeleteId(job.id);
    setJobToDelete(job);
    setPaymentInfo(null);
    
    try {
      const paymentRes = await api.getPaymentByJobId(job.id);
      if (paymentRes.status === "SUCCESS" && paymentRes.data?.status === "PAID") {
        setPaymentInfo({ hasPaidPayment: true });
      } else {
        setPaymentInfo({ hasPaidPayment: false });
      }
    } catch {
      setPaymentInfo({ hasPaidPayment: false });
    }
    
    setLoadingDeleteId(null);
    setDeleteDialogOpen(true);
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
        fetchJobs(filter === "all" ? {} : { status: filter });
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý công việc đã đăng</h1>
          <p className="text-gray-500 mt-1">
            {page ? `${page.totalElements} công việc` : "Xem và quản lý các công việc bạn đã đăng tuyển"}
          </p>
        </div>
        <Link href="/my-posted-jobs/create">
          <Button className="bg-[#00b14f] hover:bg-[#009643] w-full sm:w-auto">
            <Icon name="add" size={20} />
            Đăng việc mới
          </Button>
        </Link>
      </div>

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
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Icon name="work_off" size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không có công việc nào</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">#{job.id}</span>
                      <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-[#00b14f]">
                        {job.title}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CONFIG[job.status]?.color || "bg-gray-100 text-gray-700"}`}>
                        {JOB_STATUS_CONFIG[job.status]?.label || job.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Icon name="payments" size={16} />
                        {formatBudget(job.budget, job.currency)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="people" size={16} />
                        {job.applicationCount} ứng viên
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="visibility" size={16} />
                        {job.viewCount} lượt xem
                      </span>
                      {job.applicationDeadline && (
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" size={16} />
                          Hạn: {formatDate(job.applicationDeadline)}
                        </span>
                      )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">+{job.skills.length - 5}</span>
                        )}
                      </div>
                    )}

                    {job.status === "DRAFT" && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                        <Icon name="info" size={16} />
                        <span>Thanh toán để công việc được hiển thị công khai</span>
                      </div>
                    )}

                  </div>

                  <div className="flex flex-row sm:flex-col gap-2">
                    {job.status === "DRAFT" && (
                      <Link 
                        href={`/jobs/${job.id}/payment`} 
                        className={`flex-1 sm:flex-none ${loadingDeleteId === job.id ? "pointer-events-none" : ""}`}
                      >
                        <Button 
                          size="sm" 
                          className="w-full bg-[#00b14f] hover:bg-[#009643] text-white"
                          disabled={loadingDeleteId === job.id}
                        >
                          <Icon name="payment" size={16} />
                          <span className="ml-1">Thanh toán</span>
                        </Button>
                      </Link>
                    )}
                    <Link 
                      href={`/jobs/${job.id}`} 
                      className={`flex-1 sm:flex-none ${loadingDeleteId === job.id ? "pointer-events-none" : ""}`}
                    >
                      <Button variant="outline" size="sm" className="w-full" disabled={loadingDeleteId === job.id}>
                        <Icon name="visibility" size={16} />
                        <span className="sm:hidden lg:inline ml-1">Chi tiết</span>
                      </Button>
                    </Link>
                    {(job.status === "DRAFT" || job.status === "OPEN") && (
                      <>
                        <Link 
                          href={`/jobs/${job.id}/edit`} 
                          className={`flex-1 sm:flex-none ${loadingDeleteId === job.id ? "pointer-events-none" : ""}`}
                        >
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-[#00b14f] border-[#00b14f] hover:bg-[#00b14f]/5"
                            disabled={loadingDeleteId === job.id}
                          >
                            <Icon name="edit" size={16} />
                            <span className="sm:hidden lg:inline ml-1">Sửa</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteClick(job)}
                          disabled={loadingDeleteId === job.id}
                        >
                          {loadingDeleteId === job.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon name="delete" size={16} />
                          )}
                          <span className="sm:hidden lg:inline ml-1">Xóa</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {page && page.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page.first}
            onClick={() => fetchJobs({ status: filter === "all" ? undefined : filter, page: page.number - 1 })}
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
            onClick={() => fetchJobs({ status: filter === "all" ? undefined : filter, page: page.number + 1 })}
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
              
              {paymentInfo === null ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Đang kiểm tra thông tin thanh toán...
                </div>
              ) : paymentInfo.hasPaidPayment ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Icon name="info" size={20} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Sẽ hoàn tiền escrow</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Công việc này đã được thanh toán. Khi xóa, tiền escrow sẽ được hoàn lại vào tài khoản ZaloPay của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    Công việc chưa được thanh toán, không có khoản hoàn tiền.
                  </p>
                </div>
              )}
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
              disabled={isDeleting || paymentInfo === null}
              className="bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  );
}
