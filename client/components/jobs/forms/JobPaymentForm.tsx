"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JobPaymentForm() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-posted-jobs");
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 text-center">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Đang chuyển hướng...</p>
        <p className="text-sm text-gray-500 mt-2">
          Thanh toán job giờ được thực hiện tự động từ số dư khi tạo.
        </p>
      </div>
    </div>
  );
}
