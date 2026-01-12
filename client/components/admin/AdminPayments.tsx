"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Payment, PaymentStatus, PAYMENT_STATUS_CONFIG } from "@/types/payment";
import { Page } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "PAID", label: "Đã TT" },
  { value: "PENDING", label: "Chờ TT" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "REFUNDED", label: "Hoàn tiền" },
];

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fetchPayments = async (pageNum: number, status?: PaymentStatus) => {
    setIsLoading(true);
    setIsSearching(false);
    try {
      const response = await api.adminGetAllPayments({
        page: pageNum,
        size: 10,
        status: status || undefined,
      });
      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<Payment>;
        setPayments(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPayments = async (keyword: string, pageNum: number) => {
    if (!keyword.trim()) {
      fetchPayments(pageNum, statusFilter || undefined);
      return;
    }
    setIsLoading(true);
    setIsSearching(true);
    try {
      const response = await api.adminSearchPayments({ keyword, page: pageNum, size: 10 });
      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<Payment>;
        setPayments(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error searching payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSearching) {
      fetchPayments(page, statusFilter || undefined);
    }
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(0);
    searchPayments(searchKeyword, 0);
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setPage(0);
    fetchPayments(0, statusFilter || undefined);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
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

  if (isLoading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quản lý thanh toán</h2>
        <span className="text-xs text-gray-500">Tổng: {totalElements}</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Tìm mã GD, tên công việc..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 text-sm"
            />
            <Button onClick={handleSearch} size="sm" className="h-8 bg-[#00b14f] hover:bg-[#009643]">
              <Icon name="search" size={16} />
            </Button>
            {isSearching && (
              <Button variant="outline" size="sm" className="h-8" onClick={handleClearSearch}>
                Xóa
              </Button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PaymentStatus | "");
              setPage(0);
              setSearchKeyword("");
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
          {payments.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">Không có giao dịch nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Công việc</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Escrow</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Phí</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tổng</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TT</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-gray-900">{payment.appTransId}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{payment.jobTitle}</p>
                      <p className="text-xs text-gray-500">#{payment.jobId}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(payment.escrowAmount)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(payment.feeAmount)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(payment.totalAmount)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-gray-700">
                        {PAYMENT_STATUS_CONFIG[payment.status]?.label || payment.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{formatDate(payment.createdAt)}</td>
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
                onClick={() => {
                  const newPage = Math.max(0, page - 1);
                  setPage(newPage);
                  if (isSearching) searchPayments(searchKeyword, newPage);
                }}
                disabled={page === 0 || isLoading}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const newPage = Math.min(totalPages - 1, page + 1);
                  setPage(newPage);
                  if (isSearching) searchPayments(searchKeyword, newPage);
                }}
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
