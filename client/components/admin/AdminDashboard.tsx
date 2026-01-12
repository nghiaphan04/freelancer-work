"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PaymentStatistics } from "@/types/payment";
import { Payment } from "@/types/payment";
import Icon from "@/components/ui/Icon";

export default function AdminDashboard() {
  const [stats, setStats] = useState<PaymentStatistics | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.adminGetPaymentStatistics(),
          api.adminGetRecentPayments(),
        ]);

        if (statsRes.status === "SUCCESS") {
          setStats(statsRes.data);
        }
        if (recentRes.status === "SUCCESS") {
          setRecentPayments(recentRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Tổng quan</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="account_balance_wallet" size={18} />
            <span className="text-xs">Tổng doanh thu</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="savings" size={18} />
            <span className="text-xs">Tổng escrow</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.totalEscrowAmount || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="toll" size={18} />
            <span className="text-xs">Phí dịch vụ</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.totalFeeAmount || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="receipt_long" size={18} />
            <span className="text-xs">Tổng giao dịch</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{stats?.totalTransactions || 0}</p>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Trạng thái giao dịch</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Thành công</span>
              <span className="font-medium text-gray-900">{stats?.paidTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Đang chờ</span>
              <span className="font-medium text-gray-900">{stats?.pendingTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Đã hủy</span>
              <span className="font-medium text-gray-900">{stats?.cancelledTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hết hạn</span>
              <span className="font-medium text-gray-900">{stats?.expiredTransactions || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Thống kê theo thời gian</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Hôm nay</p>
              <p className="font-bold text-gray-900">{formatCurrency(stats?.todayRevenue || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.todayTransactions || 0} giao dịch</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tháng này</p>
              <p className="font-bold text-gray-900">{formatCurrency(stats?.monthRevenue || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.monthTransactions || 0} giao dịch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900 text-sm">Giao dịch gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          {recentPayments.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">Chưa có giao dịch nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Công việc</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-gray-900">{payment.appTransId}</td>
                    <td className="px-4 py-2 text-gray-700">{payment.jobTitle}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">
                      {formatCurrency(payment.totalAmount)}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {payment.paidAt ? formatDate(payment.paidAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
