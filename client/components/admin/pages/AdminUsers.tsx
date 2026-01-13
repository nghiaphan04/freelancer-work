"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { User, getRoleLabel } from "@/types/user";
import { Page } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await api.adminGetAllUsers({ page: pageNum, size: 10, sortBy: "id", sortDir: "desc" });
      if (response.status === "SUCCESS" && response.data) {
        const pageData = response.data as Page<User>;
        setUsers(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleToggleStatus = async (userId: number, currentEnabled: boolean) => {
    setTogglingId(userId);
    try {
      const response = await api.adminUpdateUserStatus(userId, !currentEnabled);
      if (response.status === "SUCCESS") {
        toast.success(response.message);
        fetchUsers(page);
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quản lý người dùng</h2>
        <span className="text-xs text-gray-500">Tổng: {totalElements}</span>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span className="text-xs text-gray-400">#{user.id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user.roles?.map((role) => (
                <span key={role} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                  {getRoleLabel(role)}
                </span>
              ))}
              <span className={`px-2 py-0.5 rounded text-xs ${user.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {user.enabled ? "Hoạt động" : "Vô hiệu"}
              </span>
              {user.emailVerified && (
                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                  Đã xác thực
                </span>
              )}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => handleToggleStatus(user.id, user.enabled || false)}
                disabled={togglingId === user.id || user.roles?.includes("ROLE_ADMIN")}
                className={`text-sm hover:underline disabled:opacity-50 ${
                  user.enabled ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                }`}
              >
                {togglingId === user.id ? "..." : user.enabled ? "Vô hiệu hóa" : "Kích hoạt"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Xác thực</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">#{user.id}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                          {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{user.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role) => (
                        <span key={role} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                          {getRoleLabel(role)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Icon name={user.emailVerified ? "check" : "close"} size={16} className={user.emailVerified ? "text-gray-700 mx-auto" : "text-gray-400 mx-auto"} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs ${user.enabled ? "text-gray-700" : "text-gray-400"}`}>
                      {user.enabled ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.enabled || false)}
                      disabled={togglingId === user.id || user.roles?.includes("ROLE_ADMIN")}
                      className={`text-sm hover:underline disabled:opacity-50 disabled:no-underline ${
                        user.enabled ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                      }`}
                    >
                      {togglingId === user.id ? "..." : user.enabled ? "Vô hiệu" : "Kích hoạt"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-lg shadow md:rounded-none md:shadow-none">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
