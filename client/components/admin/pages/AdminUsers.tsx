"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { User, getRoleLabel } from "@/types/user";
import { Page } from "@/types/job";
import Icon from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLoading from "../shared/AdminLoading";
import AdminPageHeader from "../shared/AdminPageHeader";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  
  // Grant credits dialog
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [isGranting, setIsGranting] = useState(false);

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

  const openGrantDialog = (user: User) => {
    setSelectedUser(user);
    setCreditAmount("");
    setGrantDialogOpen(true);
  };

  const handleGrantCredits = async () => {
    if (!selectedUser || !creditAmount) return;
    
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Số credit phải là số dương");
      return;
    }

    setIsGranting(true);
    try {
      const response = await api.adminGrantCredits(selectedUser.id, amount);
      if (response.status === "SUCCESS") {
        toast.success(response.message);
        setGrantDialogOpen(false);
        fetchUsers(page);
      } else {
        toast.error(response.message || "Không thể cấp credit");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsGranting(false);
    }
  };

  if (isLoading && users.length === 0) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Quản lý người dùng" totalElements={totalElements} />

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

            {/* Credits info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Icon name="toll" size={14} className="text-yellow-600" />
                <span className="text-gray-600">Credits:</span>
                <span className="font-medium text-gray-900">{user.credits || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="thumb_up" size={14} className="text-green-600" />
                <span className="font-medium">{user.trustScore || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="thumb_down" size={14} className="text-red-600" />
                <span className="font-medium">{user.untrustScore || 0}</span>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center">
              <button
                onClick={() => openGrantDialog(user)}
                disabled={user.roles?.includes("ROLE_ADMIN")}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
              >
                Cấp credit
              </button>
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
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Credits</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">UT/KUT</th>
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
                    <span className="font-medium text-yellow-600">{user.credits || 0}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-600 font-medium">{user.trustScore || 0}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-600 font-medium">{user.untrustScore || 0}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs ${user.enabled ? "text-gray-700" : "text-gray-400"}`}>
                      {user.enabled ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openGrantDialog(user)}
                        disabled={user.roles?.includes("ROLE_ADMIN")}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:no-underline"
                        title="Cấp credit"
                      >
                        Cấp credits
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.enabled || false)}
                        disabled={togglingId === user.id || user.roles?.includes("ROLE_ADMIN")}
                        className={`text-sm hover:underline disabled:opacity-50 disabled:no-underline ${
                          user.enabled ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                        }`}
                      >
                        {togglingId === user.id ? "..." : user.enabled ? "Vô hiệu" : "Kích hoạt"}
                      </button>
                    </div>
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

      {/* Grant Credits Dialog */}
      <Dialog 
        open={grantDialogOpen} 
        onOpenChange={(open) => {
          if (!isGranting) setGrantDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!isGranting}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="toll" size={20} className="text-yellow-600" />
              Cấp Credit
            </DialogTitle>
            <DialogDescription>
              Cấp credit cho người dùng <strong>{selectedUser?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser?.avatarUrl} alt={selectedUser?.fullName} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {selectedUser?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{selectedUser?.fullName}</p>
                <p className="text-sm text-gray-500">{selectedUser?.email}</p>
              </div>
            </div>

            {/* Current credits */}
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-600">Credits hiện tại:</span>
              <span className="font-semibold text-yellow-700">{selectedUser?.credits || 0} credits</span>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <Label htmlFor="creditAmount">Số credit cần cấp</Label>
              <Input
                id="creditAmount"
                type="number"
                min="1"
                placeholder="Nhập số credit..."
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                disabled={isGranting}
              />
              <p className="text-xs text-gray-500">
                Sau khi cấp: <strong>{(selectedUser?.credits || 0) + (parseInt(creditAmount) || 0)} credits</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantDialogOpen(false)}
              disabled={isGranting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleGrantCredits}
              disabled={isGranting || !creditAmount || parseInt(creditAmount) <= 0}
              className="bg-[#00b14f] hover:bg-[#00a047]"
            >
              {isGranting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang cấp...
                </>
              ) : (
                <>
                  <Icon name="check" size={16} className="mr-1" />
                  Cấp credit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
