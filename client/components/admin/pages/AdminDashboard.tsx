"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { BalanceStatistics, BalanceDeposit } from "@/types/balance";
import Icon from "@/components/ui/Icon";
import AdminLoading from "../shared/AdminLoading";
import AdminPageHeader from "../shared/AdminPageHeader";

export default function AdminDashboard() {
  const [stats, setStats] = useState<BalanceStatistics | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<BalanceDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, depositsRes] = await Promise.all([
          api.adminGetBalanceStatistics(),
          api.adminGetAllDeposits({ status: "PAID", page: 0, size: 10 }),
        ]);

        if (statsRes.status === "SUCCESS") {
          setStats(statsRes.data);
        }
        if (depositsRes.status === "SUCCESS" && depositsRes.data) {
          setRecentDeposits(depositsRes.data.content || []);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Tổng quan nạp tiền" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="account_balance_wallet" size={18} />
            <span className="text-xs">Tổng nạp</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.totalDeposited || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="today" size={18} />
            <span className="text-xs">Hôm nay</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.todayDeposited || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Icon name="date_range" size={18} />
            <span className="text-xs">Tháng này</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.monthDeposited || 0)}</p>
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
              <span className="font-medium text-green-600">{stats?.paidTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Đang chờ</span>
              <span className="font-medium text-yellow-600">{stats?.pendingTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Đã hủy</span>
              <span className="font-medium text-gray-600">{stats?.cancelledTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hết hạn</span>
              <span className="font-medium text-red-600">{stats?.expiredTransactions || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Thống kê theo thời gian</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Hôm nay</p>
              <p className="font-bold text-gray-900">{formatCurrency(stats?.todayDeposited || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.todayTransactions || 0} giao dịch</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tháng này</p>
              <p className="font-bold text-gray-900">{formatCurrency(stats?.monthDeposited || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.monthTransactions || 0} giao dịch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900 text-sm">Nạp tiền gần đây</h3>
        </div>

        {recentDeposits.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">Chưa có giao dịch nào</div>
        ) : (
          <>
            {/* Mobile: Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentDeposits.map((deposit) => (
                <div key={deposit.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate flex-1">{deposit.userFullName || `User #${deposit.userId}`}</p>
                    <p className="font-semibold text-[#00b14f] whitespace-nowrap">{formatCurrency(deposit.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                    <p className="font-mono truncate flex-1">{deposit.appTransId}</p>
                    <p className="whitespace-nowrap">{formatDateTime(deposit.paidAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người nạp</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentDeposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-900">{deposit.appTransId}</td>
                      <td className="px-4 py-2 text-gray-700">{deposit.userFullName || `User #${deposit.userId}`}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {formatDateTime(deposit.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
