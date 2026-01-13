"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { BalanceDeposit, DepositStatus, DEPOSIT_STATUS_CONFIG } from "@/types/balance";
import { Page } from "@/types/job";
import { Pagination } from "@/components/ui/pagination";
import AdminLoading from "../shared/AdminLoading";
import AdminPageHeader from "../shared/AdminPageHeader";
import AdminEmptyState from "../shared/AdminEmptyState";

const STATUS_OPTIONS: { value: DepositStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "PAID", label: "Đã TT" },
  { value: "PENDING", label: "Chờ TT" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

export default function AdminPayments() {
  const [deposits, setDeposits] = useState<BalanceDeposit[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DepositStatus | "">("");

  const fetchDeposits = async (pageNum: number, status?: DepositStatus) => {
    setIsLoading(true);
    try {
      const response = await api.adminGetAllDeposits({
        page: pageNum,
        size: 10,
        status: status || undefined,
      });
      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<BalanceDeposit>;
        setDeposits(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits(page, statusFilter || undefined);
  }, [page, statusFilter]);

  if (isLoading && deposits.length === 0) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Quản lý nạp tiền" totalElements={totalElements} />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DepositStatus | "");
              setPage(0);
            }}
            className="h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00b14f]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {deposits.length === 0 ? (
        <AdminEmptyState message="Không có giao dịch nào" />
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="bg-white rounded-lg shadow p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{deposit.userFullName || `User #${deposit.userId}`}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{deposit.appTransId}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${DEPOSIT_STATUS_CONFIG[deposit.status]?.color || ""}`}>
                    {DEPOSIT_STATUS_CONFIG[deposit.status]?.label || deposit.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-[#00b14f]">{formatCurrency(deposit.amount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t">
                  <div>
                    <p className="text-gray-400">Ngày tạo</p>
                    <p>{formatDateTime(deposit.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Thanh toán</p>
                    <p>{formatDateTime(deposit.paidAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người nạp</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-gray-900">{deposit.appTransId}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{deposit.userFullName || `User #${deposit.userId}`}</p>
                        <p className="text-xs text-gray-500">#{deposit.userId}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(deposit.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${DEPOSIT_STATUS_CONFIG[deposit.status]?.color || ""}`}>
                          {DEPOSIT_STATUS_CONFIG[deposit.status]?.label || deposit.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{formatDateTime(deposit.createdAt)}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDateTime(deposit.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg shadow md:rounded-none md:shadow-none">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}
