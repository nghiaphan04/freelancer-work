"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/Icon";
import { User } from "@/types/user";

interface ProfileCardProps {
  user: User;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Cover Image */}
      <div className="h-48 relative">
        <Image 
          src={user.coverImageUrl || "/background_user.png"} 
          alt="Cover" 
          fill 
          className="object-cover"
        />
        <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50">
          <Icon name="photo_camera" size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4 w-fit">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="bg-[#00b14f] text-white text-3xl">
              {user.fullName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 border border-gray-200">
            <Icon name="edit" size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Name & Info */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
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
            {user.title && <p className="text-gray-700 mt-1">{user.title}</p>}
            {user.location && (
              <p className="text-gray-500 text-sm mt-1">
                {user.location} · <a href="#" className="text-[#00b14f] hover:underline">Thông tin liên hệ</a>
              </p>
            )}
          </div>

          {/* Company */}
          {user.company && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Icon name="business" size={20} className="text-gray-500" />
              </div>
              <span className="text-sm text-gray-700">{user.company}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button className="bg-[#00b14f] hover:bg-[#009643] rounded-full">
            Sẵn sàng nhận việc
          </Button>
          <Button variant="outline" className="rounded-full border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f]/5">
            Thêm mục hồ sơ
          </Button>
          <Button variant="outline" className="rounded-full">
            Nâng cấp hồ sơ
          </Button>
          <Button variant="outline" className="rounded-full">
            Tài nguyên
          </Button>
        </div>
      </div>
    </div>
  );
}
