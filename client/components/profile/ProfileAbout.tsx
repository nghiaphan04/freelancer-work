"use client";

import Icon from "@/components/ui/Icon";

interface ProfileAboutProps {
  bio?: string;
}

export default function ProfileAbout({ bio }: ProfileAboutProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Giới thiệu</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <Icon name="edit" size={18} />
        </button>
      </div>
      {bio ? (
        <p className="text-gray-600">{bio}</p>
      ) : (
        <p className="text-gray-400 italic">Chưa có thông tin giới thiệu</p>
      )}
    </div>
  );
}
