"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/Icon";
import { User } from "@/types/user";

interface ProfileCardProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<boolean>;
  isLoading?: boolean;
}

export default function ProfileCard({ user, onUpdate, isLoading }: ProfileCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    title: user.title || "",
    location: user.location || "",
    company: user.company || "",
    phoneNumber: user.phoneNumber || "",
  });

  const handleOpenEdit = () => {
    setFormData({
      fullName: user.fullName || "",
      title: user.title || "",
      location: user.location || "",
      company: user.company || "",
      phoneNumber: user.phoneNumber || "",
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    const success = await onUpdate(formData);
    if (success) {
      setIsEditOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cover Image - responsive height */}
        <div className="h-32 sm:h-48 relative">
          <Image
            src={user.coverImageUrl || "/background_user.png"}
            alt="Cover"
            fill
            className="object-cover"
          />
          <button className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50">
            <Icon name="photo_camera" size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Avatar - responsive size */}
          <div className="relative -mt-12 sm:-mt-16 mb-3 sm:mb-4 w-fit">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-lg">
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              <AvatarFallback className="bg-[#00b14f] text-white text-2xl sm:text-3xl">
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 border border-gray-200">
              <Icon name="edit" size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Name & Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.fullName}</h1>
              <button
                onClick={handleOpenEdit}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <Icon name="edit" size={18} className="text-gray-500" />
              </button>
              {user.isVerified ? (
                <span className="text-sm text-[#00b14f] border border-[#00b14f] rounded-full px-3 py-0.5 flex items-center gap-1">
                  <Icon name="verified" size={14} />
                  Đã xác thực
                </span>
              ) : (
                <button className="text-sm text-[#00b14f] border border-[#00b14f] rounded-full px-3 py-0.5 hover:bg-[#00b14f]/5 flex items-center gap-1">
                  <Icon name="verified" size={14} />
                  Thêm huy hiệu xác thực
                </button>
              )}
            </div>

            {/* Title, Location, Company - hiển thị hoặc placeholder */}
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
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Icon name="business" size={16} className="text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-700">{user.company}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Placeholder buttons - responsive */}
            {(!user.title || !user.location || !user.company) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3">
                {!user.title && (
                  <button
                    onClick={handleOpenEdit}
                    className="text-gray-400 text-sm hover:text-[#00b14f] flex items-center gap-1"
                  >
                    <Icon name="add" size={16} />
                    Thêm chức danh
                  </button>
                )}
                {!user.location && (
                  <button
                    onClick={handleOpenEdit}
                    className="text-gray-400 text-sm hover:text-[#00b14f] flex items-center gap-1"
                  >
                    <Icon name="add" size={16} />
                    Thêm địa điểm
                  </button>
                )}
                {!user.company && (
                  <button
                    onClick={handleOpenEdit}
                    className="text-gray-400 text-sm hover:text-[#00b14f] flex items-center gap-1"
                  >
                    <Icon name="add" size={16} />
                    Thêm công ty
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons - responsive */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button className="bg-[#00b14f] hover:bg-[#009643] rounded-full w-full sm:w-auto">
              {user.isOpenToWork ? "Đang tìm việc" : "Sẵn sàng nhận việc"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f]/5 w-full sm:w-auto"
              onClick={handleOpenEdit}
            >
              Chỉnh sửa hồ sơ
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin cơ bản</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Nhập họ và tên"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Chức danh</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="VD: Senior Software Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Công ty</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="VD: ABC Technology"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Địa điểm</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="VD: Hồ Chí Minh, Việt Nam"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="VD: 0901234567"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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
