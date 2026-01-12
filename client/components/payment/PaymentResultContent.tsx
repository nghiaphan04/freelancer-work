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
  const jobId = searchParams.get("jobId");
  
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!appTransId || !jobId) {
      setStatus("cancelled");
      return;
    }

    const check = async () => {
      try {
        const res = await api.queryPaymentStatus(appTransId);
        if (res.data?.status === "PAID") {
          setStatus("success");
        } else {
          setStatus("cancelled");
        }
      } catch {
        setStatus("cancelled");
      }
    };

    check();
  }, [appTransId, jobId]);

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
          Công việc vẫn ở trạng thái nháp và chưa được hiển thị công khai.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/my-posted-jobs" className="block">
            <Button className="w-full bg-[#00b14f] hover:bg-[#009a44]">
              Quản lý công việc
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
      <p className="text-gray-500 mb-6">
        Công việc đã được đăng và hiển thị công khai.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/my-posted-jobs" className="block">
          <Button className="w-full bg-[#00b14f] hover:bg-[#009a44]">
            Quản lý công việc
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
