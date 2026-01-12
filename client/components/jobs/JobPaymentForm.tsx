"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";
import { Payment } from "@/types/payment";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

export default function JobPaymentForm() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const response = await api.createPayment(Number(jobId));

        if (response.status === "SUCCESS" && response.data) {
          setPayment(response.data);
        } else {
          setError(response.message || "Không thể tạo đơn thanh toán");
        }
      } catch (err) {
        console.error("Payment error:", err);
        setError("Đã có lỗi xảy ra khi tạo đơn thanh toán");
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      initPayment();
    }
  }, [jobId]);

  const handlePayNow = () => {
    if (payment?.orderUrl) {
      window.location.href = payment.orderUrl;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Đang tạo đơn thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="error" size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lỗi thanh toán</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Quay lại
            </Button>
            <Link href="/my-posted-jobs">
              <Button variant="ghost" className="w-full">
                Về trang quản lý
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Link
        href="/my-posted-jobs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4"
      >
        <Icon name="arrow_back" size={20} />
        Quay lại
      </Link>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div 
          className="relative bg-cover bg-center text-white p-8 text-center"
          style={{ backgroundImage: "url('/landing/slide1.png')" }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Content */}
          <div className="relative z-10">
            <Icon name="payment" size={48} className="mx-auto mb-2" />
            <h1 className="text-2xl font-bold">Thanh toán đăng tin</h1>
            <p className="text-gray-200 mt-1">Hoàn tất thanh toán để công việc được hiển thị</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Mã công việc</span>
              <span className="font-medium">#{jobId}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Ngân sách công việc (Escrow)</span>
              <span className="font-medium">{formatCurrency(payment?.escrowAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Phí dịch vụ (5%)</span>
              <span className="font-medium">{formatCurrency(payment?.feeAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">Tổng thanh toán</span>
              <span className="text-xl font-bold text-[#00b14f]">
                {formatCurrency(payment?.totalAmount || 0)}
              </span>
            </div>
          </div>


          {/* QR Code */}
          {payment?.orderUrl && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-3">Quét mã QR bằng ứng dụng ZaloPay:</p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <QRCodeSVG 
                  value={payment.orderUrl} 
                  size={192}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={handlePayNow}
              className="w-full bg-[#00b14f] hover:bg-[#009a44] text-white py-6 text-lg"
            >
              <Icon name="open_in_new" size={20} className="mr-2" />
              Thanh toán qua ZaloPay
            </Button>

            <div className="flex gap-3">
              <Button onClick={() => router.back()} variant="outline" className="flex-1">
                Quay lại chỉnh sửa
              </Button>
              <Link href="/my-posted-jobs" className="flex-1">
                <Button variant="ghost" className="w-full">
                  Thanh toán sau
                </Button>
              </Link>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Mã giao dịch: <code className="bg-gray-100 px-2 py-1 rounded">{payment?.appTransId}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
