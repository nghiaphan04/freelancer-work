"use client";

import Icon from "@/components/ui/Icon";

interface BalanceCardsProps {
  balance: number;
  credits: number;
}

export default function BalanceCards({ balance, credits }: BalanceCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tài khoản</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
          <Icon name="account_balance_wallet" size={32} className="text-[#00b14f]" />
          <div>
            <p className="text-sm text-gray-500">Số dư</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(balance)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
          <Icon name="stars" size={32} className="text-amber-500" />
          <div>
            <p className="text-sm text-gray-500">Credit</p>
            <p className="text-xl font-bold text-gray-900">{credits}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
