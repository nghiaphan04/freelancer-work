"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 py-6">{children}</main>
      <Footer />
    </div>
  );
}
