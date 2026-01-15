"use client";

import { BalanceDeposit, DEPOSIT_STATUS_CONFIG } from "@/types/balance";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/Icon";

interface DepositHistoryProps {
  deposits: BalanceDeposit[];
  isLoading: boolean;
}

export default function DepositHistory({ deposits, isLoading }: DepositHistoryProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val || 0);

  const formatDate = (str?: string) =>
    str ? new Date(str).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  const handlePay = (orderUrl: string) => {
    window.open(orderUrl, "_blank");
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Lịch sử nạp tiền</h2>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-6 h-6 border-2 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">Chưa có giao dịch</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deposits.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-900">{d.appTransId}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(d.amount)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${DEPOSIT_STATUS_CONFIG[d.status]?.color || ""}`}>
                      {DEPOSIT_STATUS_CONFIG[d.status]?.label || d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-2 text-center">
                    {d.status === "PENDING" && d.orderUrl ? (
                      <Button
                        size="sm"
                        onClick={() => handlePay(d.orderUrl!)}
                        className="bg-[#00b14f] hover:bg-[#009643]"
                      >
                        <Icon name="payment" size={14} />
                        Thanh toán
                      </Button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
