"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { BalanceDeposit } from "@/types/balance";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DepositFormProps {
  onSuccess: (amount: number) => void;
  onRefresh: () => void;
  disabled?: boolean;
  setProcessing?: (v: boolean) => void;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

type TabType = "deposit" | "withdraw";

export default function DepositForm({ onSuccess, onRefresh, disabled, setProcessing }: DepositFormProps) {
  const [tab, setTab] = useState<TabType>("deposit");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [deposit, setDeposit] = useState<BalanceDeposit | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val || 0);

  const handleDeposit = async () => {
    const value = parseInt(amount);
    if (!value || value < 10000) {
      toast.error("Số tiền nạp tối thiểu 10,000đ");
      return;
    }
    setIsLoading(true);
    setProcessing?.(true);
    try {
      const res = await api.createDeposit(value);
      if (res.status === "SUCCESS" && res.data) {
        setDeposit(res.data);
        setShowQR(true);
        setAmount("");
        onRefresh();
      } else {
        toast.error(res.message || "Không thể tạo đơn nạp tiền");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
      setProcessing?.(false);
    }
  };

  const handleOpenZaloPay = () => {
    if (!deposit?.orderUrl) return;
    window.open(deposit.orderUrl, "_blank");
    setIsChecking(true);
    setTimeout(() => checkStatus(), 3000);
  };

  const checkStatus = async () => {
    if (!deposit) return;
    setIsChecking(true);
    try {
      const res = await api.queryDepositStatus(deposit.appTransId);
      if (res.status === "SUCCESS" && res.data?.status === "PAID") {
        toast.success("Nạp tiền thành công!");
        onSuccess(res.data.amount);
        setShowQR(false);
        onRefresh();
      } else {
        toast.info("Chưa nhận được thanh toán. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Lỗi kiểm tra");
    } finally {
      setIsChecking(false);
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <>
      <div className={`bg-white rounded-lg shadow overflow-hidden ${isDisabled ? "opacity-60" : ""}`}>
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("deposit")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "deposit"
                ? "text-[#00b14f] border-b-2 border-[#00b14f]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Nạp tiền
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "withdraw"
                ? "text-[#00b14f] border-b-2 border-[#00b14f]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Rút tiền
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === "deposit" ? (
            <fieldset disabled={isDisabled} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  min={10000}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:border-[#00b14f] hover:text-[#00b14f] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
              <Button onClick={handleDeposit} disabled={isDisabled || !amount} className="w-full bg-[#00b14f] hover:bg-[#009643]">
                {isLoading ? "Đang xử lý..." : "Tạo mã QR nạp tiền"}
              </Button>
            </fieldset>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-xl font-bold text-gray-400">Coming soon...</p>
            </div>
          )}
        </div>
      </div>

      <Dialog 
        open={showQR} 
        onOpenChange={(open) => {
          if (!isChecking) setShowQR(open);
        }}
      >
        <DialogContent showCloseButton={!isChecking}>
          <DialogHeader>
            <DialogTitle>Thanh toán qua ZaloPay</DialogTitle>
            <DialogDescription>
              Nhấn nút bên dưới để mở ứng dụng ZaloPay và hoàn tất thanh toán.
            </DialogDescription>
          </DialogHeader>
          {deposit && (
            <div className="py-4">
              <p className="font-medium text-gray-900 mb-2">Số tiền: {formatCurrency(deposit.amount)}</p>
              <p className="text-sm text-gray-500">Mã GD: {deposit.appTransId}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQR(false)}
              disabled={isChecking}
            >
              Hủy
            </Button>
            {deposit?.orderUrl && (
              <Button
                onClick={handleOpenZaloPay}
                disabled={isChecking}
                className="bg-[#00b14f] hover:bg-[#009643]"
              >
                {isChecking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <Icon name="open_in_new" size={16} />
                    Mở ZaloPay
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
