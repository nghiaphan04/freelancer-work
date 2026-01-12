"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

export default function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon name="warning" size={48} className="text-yellow-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán bị hủy</h1>
      <p className="text-gray-600 mb-6">
        Bạn đã hủy thanh toán. Công việc vẫn ở trạng thái nháp và chưa được hiển thị công khai.
      </p>

      {jobId && (
        <div className="mb-6 text-sm text-gray-500">
          Mã công việc: <code className="bg-gray-100 px-2 py-1 rounded">#{jobId}</code>
        </div>
      )}

      <div className="space-y-3">
        <Link href="/my-posted-jobs">
          <Button className="w-full bg-[#00b14f] hover:bg-[#009a44]">
            <Icon name="work" size={20} className="mr-2" />
            Quản lý công việc
          </Button>
        </Link>

        <Link href="/">
          <Button variant="outline" className="w-full">
            Về trang chủ
          </Button>
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t">
        <p className="text-sm text-gray-500">
          Bạn có thể thanh toán lại bất cứ lúc nào trong mục{" "}
          <strong>&quot;Quản lý công việc&quot;</strong>
        </p>
      </div>
    </div>
  );
}
