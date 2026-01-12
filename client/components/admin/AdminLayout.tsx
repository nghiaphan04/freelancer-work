"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { clearAuthData } from "@/constant/auth";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminPayments from "./AdminPayments";

type TabType = "dashboard" | "users" | "payments";

const TABS = [
  { id: "dashboard" as TabType, label: "Tổng quan", icon: "dashboard" },
  { id: "users" as TabType, label: "Người dùng", icon: "group" },
  { id: "payments" as TabType, label: "Thanh toán", icon: "payments" },
];

export default function AdminLayout() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.logout();
      clearAuthData();
      setUser(null);
      toast.success("Đăng xuất thành công");
      router.push("/login");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.fullName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#00b14f]/10 text-[#00b14f] font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                  }`}
                >
                  <Icon name={tab.icon} size={20} className={activeTab === tab.id ? "text-[#00b14f]" : "text-gray-500"} />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="logout" size={18} />
            )}
            Đăng xuất
          </Button>
          <p className="text-xs text-gray-400 text-center">WorkHub Admin v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "payments" && <AdminPayments />}
      </main>
    </div>
  );
}
