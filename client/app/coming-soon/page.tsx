"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-400">
          Coming soon...
        </h1>
      </main>

      <Footer />
    </div>
  );
}
