"use client";

import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationListProps } from "./types";

export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header + Search */}
      <div className="shrink-0 md:border-b border-gray-200">
        <div className="pt-6 pb-2 px-4 md:pt-3 md:pb-1">
          <h1 className="text-2xl md:text-xl font-bold text-gray-900">Đoạn chat</h1>
        </div>
        <div className="px-4 pb-3 md:pb-2.5">
          <div className="relative">
            <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 rounded-full bg-gray-100 border-0 focus-visible:ring-[#00b14f] h-10"
            />
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 p-4">
            <Icon name="forum" size={48} className="text-gray-300 mb-2" />
            <p className="text-sm">
              {searchQuery ? "Không tìm thấy kết quả" : "Chưa có cuộc hội thoại nào"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 md:py-2.5 active:bg-gray-100 md:hover:bg-gray-50 transition-colors ${
                selectedId === conv.id ? "md:bg-[#00b14f]/5" : ""
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-14 h-14 md:w-12 md:h-12">
                  <AvatarImage src={conv.user.avatar} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-lg md:text-base">
                    {conv.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {conv.user.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold md:font-medium truncate text-base md:text-sm ${conv.unread > 0 ? "text-gray-900" : "text-gray-700"}`}>
                    {conv.user.name}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{conv.time}</span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${conv.unread > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-[#00b14f] text-white text-xs rounded-full flex items-center justify-center shrink-0">
                  {conv.unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
