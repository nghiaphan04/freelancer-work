import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PaymentCancelContent from "@/components/payment/PaymentCancelContent";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 py-6 flex items-center justify-center">
        <PaymentCancelContent />
      </main>
      <Footer />
    </div>
  );
}
