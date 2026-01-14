"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/Icon";
import { ImageUploadButton } from "@/components/ui/file-upload";
import { User } from "@/types/user";
import { toast } from "sonner";

interface ProfileCardProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<boolean>;
  isLoading?: boolean;
}

export default function ProfileCard({ user, onUpdate, isLoading }: ProfileCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [roleInput, setRoleInput] = useState("");
  const [formData, setFormData] = useState({
    fullName: user.fullName || "Nguyễn Văn A",
    title: user.title || "Senior Software Engineer",
    location: user.location || "Hồ Chí Minh, Việt Nam",
    company: user.company || "ABC Technology",
    phoneNumber: user.phoneNumber || "0901234567",
    isOpenToWork: user.isOpenToWork ?? true,
    openToWorkRoles: user.openToWorkRoles?.length ? user.openToWorkRoles : ["Frontend Developer", "Fullstack Developer"],
    bankAccountNumber: user.bankAccountNumber || "1234567890",
    bankName: user.bankName || "Vietcombank",
  });

  const handleOpenEdit = () => {
    setFormData({
      fullName: user.fullName || "Nguyễn Văn A",
      title: user.title || "Senior Software Engineer",
      location: user.location || "Hồ Chí Minh, Việt Nam",
      company: user.company || "ABC Technology",
      phoneNumber: user.phoneNumber || "0901234567",
      isOpenToWork: user.isOpenToWork ?? true,
      openToWorkRoles: user.openToWorkRoles?.length ? user.openToWorkRoles : ["Frontend Developer", "Fullstack Developer"],
      bankAccountNumber: user.bankAccountNumber || "1234567890",
      bankName: user.bankName || "Vietcombank",
    });
    setRoleInput("");
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    // Chỉ gửi form data, không gửi avatar/cover (tách riêng)
    const success = await onUpdate(formData);
    if (success) {
      setIsEditOpen(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    if (!url || url === user.avatarUrl) return;
    const success = await onUpdate({ avatarUrl: url });
    if (success) {
      toast.success("Cập nhật ảnh đại diện thành công");
    }
  };

  const handleCoverUpload = async (url: string) => {
    if (!url || url === user.coverImageUrl) return;
    const success = await onUpdate({ coverImageUrl: url });
    if (success) {
      toast.success("Cập nhật ảnh bìa thành công");
    }
  };

  const addRole = () => {
    const role = roleInput.trim();
    if (role && formData.openToWorkRoles.length < 10 && !formData.openToWorkRoles.includes(role)) {
      setFormData(prev => ({ ...prev, openToWorkRoles: [...prev.openToWorkRoles, role] }));
      setRoleInput("");
    }
  };

  const removeRole = (role: string) => {
    setFormData(prev => ({ ...prev, openToWorkRoles: prev.openToWorkRoles.filter(r => r !== role) }));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-32 sm:h-48 relative">
          <Image
            src={user.coverImageUrl || "/background_user.png"}
            alt="Cover"
            fill
            className="object-cover"
          />
          <ImageUploadButton
            onUpload={handleCoverUpload}
            usage="COVER_IMAGE"
            disabled={isLoading}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
          >
            <Icon name="photo_camera" size={18} className="text-gray-600" />
          </ImageUploadButton>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="relative -mt-12 sm:-mt-16 mb-3 sm:mb-4 w-fit">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-lg">
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              <AvatarFallback className="bg-[#00b14f] text-white text-2xl sm:text-3xl">
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <ImageUploadButton
              onUpload={handleAvatarUpload}
              usage="AVATAR"
              disabled={isLoading}
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 border border-gray-200 disabled:opacity-50"
            >
              <Icon name="photo_camera" size={14} className="text-gray-600" />
            </ImageUploadButton>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.fullName}</h1>
              <button
                onClick={handleOpenEdit}
                disabled={isLoading}
                className="text-gray-500 hover:text-[#00b14f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="edit" size={18} />
              </button>
              {user.isVerified ? (
                <span className="text-sm text-[#00b14f] border border-[#00b14f] rounded-full px-3 py-0.5 flex items-center gap-1">
                  <Icon name="verified" size={14} />
                  Đã xác thực
                </span>
              ) : (
                <button disabled={isLoading} className="text-sm text-[#00b14f] border border-[#00b14f] rounded-full px-3 py-0.5 hover:bg-[#00b14f]/5 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Icon name="verified" size={14} />
                  Thêm huy hiệu xác thực
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Icon name="verified" size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {user.trustScore ?? 0} UT
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="dangerous" size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-600">
                  {user.untrustScore ?? 0} KUT
                </span>
              </div>
            </div>

            {(user.title || user.location || user.company) ? (
              <div className="mt-2 space-y-1">
                {user.title && <p className="text-gray-700">{user.title}</p>}
                {user.location && (
                  <p className="text-gray-500 text-sm">
                    {user.location} ·{" "}
                    <a href="#" className="text-[#00b14f] hover:underline">
                      Thông tin liên hệ
                    </a>
                  </p>
                )}
                {user.company && (
                  <div className="flex items-center gap-2 mt-2">
                    <Icon name="business" size={20} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{user.company}</span>
                  </div>
                )}
              </div>
            ) : null}

            {(!user.title || !user.location || !user.company) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3">
                {!user.title && (
                  <button
                    onClick={handleOpenEdit}
                    disabled={isLoading}
                    className="text-gray-400 text-sm hover:text-[#00b14f] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="add" size={16} />
                    Thêm chức danh
                  </button>
                )}
                {!user.location && (
                  <button
                    onClick={handleOpenEdit}
                    disabled={isLoading}
                    className="text-gray-400 text-sm hover:text-[#00b14f] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="add" size={16} />
                    Thêm địa điểm
                  </button>
                )}
                {!user.company && (
                  <button
                    onClick={handleOpenEdit}
                    disabled={isLoading}
                    className="text-gray-400 text-sm hover:text-[#00b14f] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="add" size={16} />
                    Thêm công ty
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              className={`rounded-full w-full sm:w-auto ${user.isOpenToWork ? "bg-[#00b14f] hover:bg-[#009643]" : "bg-gray-500 hover:bg-gray-600"}`}
              onClick={handleOpenEdit}
              disabled={isLoading}
            >
              {user.isOpenToWork ? "Đang tìm việc" : "Chưa sẵn sàng"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f]/5 w-full sm:w-auto"
              onClick={handleOpenEdit}
              disabled={isLoading}
            >
              Chỉnh sửa hồ sơ
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => !isLoading && setIsEditOpen(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-thin rounded-lg" onPointerDownOutside={(e) => isLoading && e.preventDefault()} onEscapeKeyDown={(e) => isLoading && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="VD: 0901234567"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Chức danh</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Senior Software Engineer"
                disabled={isLoading}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Công ty</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="VD: ABC Technology"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="VD: Hồ Chí Minh, Việt Nam"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label>Sẵn sàng nhận việc</Label>
                  <p className="text-sm text-gray-500">Hiển thị trạng thái tìm việc trên hồ sơ</p>
                </div>
                <Switch
                  checked={formData.isOpenToWork}
                  onCheckedChange={(checked) => setFormData({ ...formData, isOpenToWork: checked })}
                  disabled={isLoading}
                />
              </div>

              {formData.isOpenToWork && (
                <div className="grid gap-2">
                  <Label>Vị trí mong muốn</Label>
                  <div className="flex gap-2">
                    <Input
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="VD: Frontend Developer"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRole(); } }}
                      disabled={isLoading}
                    />
                    <Button type="button" variant="outline" onClick={addRole} disabled={isLoading}>Thêm</Button>
                  </div>
                  {formData.openToWorkRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.openToWorkRoles.map((role) => (
                        <span key={role} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {role}
                          <button type="button" onClick={() => removeRole(role)} className="hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                            <Icon name="close" size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-medium">Thông tin ngân hàng</Label>
              <p className="text-sm text-gray-500 mb-3">Để nhận thanh toán từ các công việc</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankName">Tên ngân hàng</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="VD: Vietcombank"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bankAccountNumber">So tai khoan</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="VD: 1234567890"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-[#00b14f] hover:bg-[#009643]"
            >
              {isLoading ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
