"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JobDetail from "@/components/jobs/detail/JobDetail";

export default function JobDetailPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 py-6">
        <JobDetail />
      </main>
      <Footer />
    </div>
  );
}
