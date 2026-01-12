import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PaymentSuccessContent from "@/components/payment/PaymentSuccessContent";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 py-6 flex items-center justify-center">
        <Suspense fallback={<div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />}>
          <PaymentSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
