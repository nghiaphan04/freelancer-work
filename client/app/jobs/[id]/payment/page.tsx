"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Job payment is now handled via blockchain escrow
// Employer creates escrow on smart contract when posting job
// Redirect to my-posted-jobs
export default function JobPaymentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-posted-jobs");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Đang chuyển hướng...</p>
        <p className="text-sm text-gray-500 mt-2">
          Thanh toán được thực hiện qua ví Aptos trên blockchain.
        </p>
      </div>
    </div>
  );
}
