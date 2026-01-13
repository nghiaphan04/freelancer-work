"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/admin/layout/AdminLayout";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !isAdmin) {
      router.push("/");
    }
  }, [isHydrated, isAuthenticated, isAdmin, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !isAdmin) {
    return null;
  }

  return <AdminLayout />;
}
