"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BalanceDeposit, DepositStatus, DEPOSIT_STATUS_CONFIG } from "@/types/balance";
import { Page } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && deposits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quản lý nạp tiền</h2>
        <span className="text-xs text-gray-500">Tổng: {totalElements}</span>
      </div>

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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {deposits.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">Không có giao dịch nào</div>
          ) : (
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
                    <td className="px-3 py-2 text-gray-500">{formatDate(deposit.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-500">{formatDate(deposit.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-3 py-2 border-t flex items-center justify-between">
            <p className="text-xs text-gray-500">Trang {page + 1}/{totalPages}</p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
