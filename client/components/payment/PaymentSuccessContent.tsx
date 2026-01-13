"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function PaymentSuccessContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/wallet");
  }, [router]);

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4 text-center">
      <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Đang chuyển hướng...</p>
    </div>
  );
}
