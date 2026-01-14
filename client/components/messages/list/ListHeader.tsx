"use client";

import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";

interface ListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ListHeader({ searchQuery, onSearchChange }: ListHeaderProps) {
  return (
    <div className="shrink-0 md:border-b border-gray-200">
      <div className="pt-6 pb-2 px-4 md:pt-3 md:pb-1">
        <h1 className="text-2xl md:text-xl font-bold text-gray-900">Đoạn chat</h1>
      </div>
      <div className="px-4 pb-3 md:pb-2.5">
        <div className="relative">
          <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-full bg-gray-100 border-0 focus-visible:ring-[#00b14f] h-10"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-xs text-gray-500 mt-1 px-1">Nhập ít nhất 3 ký tự để tìm kiếm</p>
        )}
      </div>
    </div>
  );
}
