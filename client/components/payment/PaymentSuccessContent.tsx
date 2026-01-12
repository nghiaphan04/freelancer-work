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
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon name="check_circle" size={48} className="text-[#00b14f]" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
      <p className="text-gray-600 mb-6">
        Công việc của bạn đã được đăng và hiển thị công khai để freelancer ứng tuyển.
      </p>

      <div className="mb-6 space-y-2 text-sm text-gray-500">
        {jobId && (
          <div>
            Mã công việc: <code className="bg-gray-100 px-2 py-1 rounded">#{jobId}</code>
          </div>
        )}
        {appTransId && (
          <div>
            Mã giao dịch: <code className="bg-gray-100 px-2 py-1 rounded">{appTransId}</code>
          </div>
        )}
      </div>

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
        <p className="text-sm text-gray-500 mb-3">Tiếp theo bạn có thể:</p>
        <ul className="text-sm text-gray-600 text-left space-y-2">
          <li className="flex items-start gap-2">
            <Icon name="check" size={16} className="text-[#00b14f] mt-0.5" />
            Theo dõi các ứng viên trong mục "Quản lý công việc"
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={16} className="text-[#00b14f] mt-0.5" />
            Liên hệ với freelancer phù hợp
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={16} className="text-[#00b14f] mt-0.5" />
            Đăng thêm công việc mới
          </li>
        </ul>
      </div>
    </div>
  );
}
