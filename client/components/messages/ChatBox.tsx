"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatBoxProps } from "./types";

export default function ChatBox({ 
  user, 
  messages, 
  onBack, 
  onSend,
  showBackButton = false 
}: ChatBoxProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSend?.(message);
    setMessage("");
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Icon name="forum" size={64} className="mx-auto mb-4 text-gray-300" />
          <p>Chọn một cuộc hội thoại để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="shrink-0 border-b border-gray-200 safe-area-top">
        <div className="flex items-center gap-3 px-3 md:px-4 py-3 mt-1 md:mt-1.5 md:mb-1">
        {showBackButton && (
          <button onClick={onBack} className="p-2 -ml-1 active:bg-gray-100 rounded-full md:hidden">
            <Icon name="arrow_back" size={24} className="text-gray-700" />
          </button>
        )}
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-gray-200 text-gray-600">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{user.name}</h2>
          <p className="text-xs text-gray-500">
            {user.online ? (
              <span className="text-green-500">Đang hoạt động</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
        <button className="p-2 active:bg-gray-100 md:hover:bg-gray-100 rounded-full">
          <Icon name="phone" size={22} className="text-[#00b14f]" />
        </button>
        <button className="p-2 active:bg-gray-100 md:hover:bg-gray-100 rounded-full">
          <Icon name="videocam" size={22} className="text-[#00b14f]" />
        </button>
        <button className="p-2 active:bg-gray-100 md:hover:bg-gray-100 rounded-full">
          <Icon name="info" size={22} className="text-[#00b14f]" />
        </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 scrollbar-hide bg-white">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-3xl ${
                  msg.sender === "me"
                    ? "bg-[#00b14f] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-white/70" : "text-gray-400"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input - fixed at bottom on mobile */}
      <div className="border-t border-gray-100 bg-white safe-area-bottom shrink-0">
        <div className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-2 mb-1 md:mb-1.5 mt-1">
          <button className="p-1.5 active:bg-gray-100 rounded-full shrink-0">
            <Icon name="add_circle" size={22} className="text-[#00b14f]" />
          </button>
          <button className="p-1.5 active:bg-gray-100 rounded-full shrink-0">
            <Icon name="camera_alt" size={20} className="text-[#00b14f]" />
          </button>
          <button className="p-1.5 active:bg-gray-100 rounded-full shrink-0">
            <Icon name="image" size={20} className="text-[#00b14f]" />
          </button>
          <button className="p-1.5 active:bg-gray-100 rounded-full shrink-0">
            <Icon name="mic" size={20} className="text-[#00b14f]" />
          </button>
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Aa"
            className="flex-1 rounded-full bg-gray-100 border-0 focus-visible:ring-[#00b14f] h-9"
          />
          {message.trim() ? (
            <button
              onClick={handleSend}
              className="p-1.5 shrink-0"
            >
              <Icon name="send" size={20} className="text-[#00b14f]" />
            </button>
          ) : (
            <button className="p-1.5 shrink-0">
              <Icon name="thumb_up" size={22} className="text-[#00b14f]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
