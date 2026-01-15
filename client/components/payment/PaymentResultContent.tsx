"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "cancelled";

export default function PaymentResultContent() {
  const searchParams = useSearchParams();
  const appTransId = searchParams.get("apptransid");
  const type = searchParams.get("type"); // "balance" for balance deposit
  
  const [status, setStatus] = useState<Status>("loading");
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!appTransId) {
      setStatus("cancelled");
      return;
    }

    const check = async () => {
      try {
        // Check balance deposit status
        const res = await api.queryDepositStatus(appTransId);
        if (res.data?.status === "PAID") {
          setStatus("success");
          setAmount(res.data.amount);
        } else {
          setStatus("cancelled");
        }
      } catch {
        setStatus("cancelled");
      }
    };

    check();
  }, [appTransId, type]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (status === "loading") {
    return (
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4 text-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Đang kiểm tra...</p>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4 text-center">
        <Icon name="warning" size={56} className="text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán bị hủy</h1>
        <p className="text-gray-500 mb-6">
          Giao dịch nạp tiền chưa hoàn thành hoặc đã hết hạn.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/wallet" className="block">
            <Button className="w-full bg-[#00b14f] hover:bg-[#009a44]">
              Quay lại Ví
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4 text-center">
      <Icon name="check_circle" size={56} className="text-[#00b14f] mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nạp tiền thành công!</h1>
      {amount && (
        <p className="text-3xl font-bold text-[#00b14f] mb-4">{formatCurrency(amount)}</p>
      )}
      <p className="text-gray-500 mb-6">
        Số dư đã được cộng vào ví của bạn.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/wallet" className="block">
          <Button className="w-full bg-[#00b14f] hover:bg-[#009a44]">
            Xem ví của tôi
          </Button>
        </Link>
        <Link href="/jobs" className="block">
          <Button variant="outline" className="w-full">
            Tìm việc
          </Button>
        </Link>
      </div>
    </div>
  );
}
