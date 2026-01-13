"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JobApplicationsTable from "@/components/jobs/tables/JobApplicationsTable";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function JobApplicationsPage() {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 py-6">
        <JobApplicationsTable />
      </main>
      <Footer />
    </div>
  );
}
