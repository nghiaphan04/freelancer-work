"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const appTransId = searchParams.get("apptransid");
  const jobId = searchParams.get("jobId");

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4 text-center">
      <Icon name="check_circle" size={56} className="text-[#00b14f] mx-auto mb-4" />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
      <p className="text-gray-500 mb-6">
        Công việc của bạn đã được đăng và hiển thị công khai để freelancer ứng tuyển.
      </p>

      <div className="mb-6 space-y-1 text-sm text-gray-500">
        {jobId && (
          <div>
            Mã công việc: <span className="text-gray-700 font-medium">#{jobId}</span>
          </div>
        )}
        {appTransId && (
          <div>
            Mã giao dịch: <span className="text-gray-700 font-medium">{appTransId}</span>
          </div>
        )}
      </div>

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

      <div className="mt-6 pt-6 border-t text-left">
        <p className="text-sm text-gray-500 mb-3">Tiếp theo bạn có thể:</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center gap-2">
            <Icon name="check" size={16} className="text-gray-400" />
            Theo dõi các ứng viên trong mục "Quản lý công việc"
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check" size={16} className="text-gray-400" />
            Liên hệ với freelancer phù hợp
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check" size={16} className="text-gray-400" />
            Đăng thêm công việc mới
          </li>
        </ul>
      </div>
    </div>
  );
}
