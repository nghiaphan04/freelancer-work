"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

export default function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4 text-center">
      <Icon name="warning" size={56} className="text-amber-500 mx-auto mb-4" />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán bị hủy</h1>
      <p className="text-gray-500 mb-6">
        Bạn đã hủy thanh toán. Công việc vẫn ở trạng thái nháp và chưa được hiển thị công khai.
      </p>

      {jobId && (
        <div className="mb-6 text-sm text-gray-500">
          Mã công việc: <span className="text-gray-700 font-medium">#{jobId}</span>
        </div>
      )}

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

      <p className="mt-6 pt-6 border-t text-sm text-gray-500">
        Bạn có thể thanh toán lại bất cứ lúc nào trong mục{" "}
        <span className="font-medium text-gray-700">&quot;Quản lý công việc&quot;</span>
      </p>
    </div>
  );
}
