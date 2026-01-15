"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { clearAuthData } from "@/constant/auth";
import Icon from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsers from "../pages/AdminUsers";
import AdminPayments from "../pages/AdminPayments";
import AdminJobs from "../pages/AdminJobs";
import AdminDisputes from "../pages/AdminDisputes";

type TabType = "dashboard" | "jobs" | "disputes" | "users" | "payments";

const TABS = [
  { id: "dashboard" as TabType, label: "Tổng quan", icon: "dashboard" },
  { id: "jobs" as TabType, label: "Duyệt công việc", icon: "work" },
  { id: "disputes" as TabType, label: "Tranh chấp", icon: "gavel" },
  { id: "users" as TabType, label: "Người dùng", icon: "group" },
  { id: "payments" as TabType, label: "Thanh toán", icon: "payments" },
];

export default function AdminLayout() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon name="admin_panel_settings" size={22} className="text-[#00b14f]" />
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-1 rounded hover:bg-gray-100"
        >
          <Icon name="close" size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#00b14f]/10 text-[#00b14f] font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon name={tab.icon} size={18} className={activeTab === tab.id ? "text-[#00b14f]" : "text-gray-400"} />
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="logout" size={18} />
          )}
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Icon name="admin_panel_settings" size={22} className="text-[#00b14f]" />
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Icon name="menu" size={24} className="text-gray-700" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay - Full screen */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <aside className="absolute inset-0 bg-white flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "jobs" && <AdminJobs />}
        {activeTab === "disputes" && <AdminDisputes />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "payments" && <AdminPayments />}
      </main>
    </div>
  );
}
