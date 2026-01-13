"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WalletContent from "@/components/wallet/WalletContent";

export default function WalletPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 py-6">
        <WalletContent user={user} />
      </main>
      <Footer />
    </div>
  );
}
