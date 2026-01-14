"use client";

import { forwardRef } from "react";
import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/lib/api";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendLike?: () => void;
  onCancelEdit?: () => void;
  onCancelReply?: () => void;
  editingMessage?: ChatMessage | null;
  replyingTo?: ChatMessage | null;
  currentUserId: number;
  rateLimitError?: string | null;
  isBlocked?: boolean;
  blockedByMe?: boolean;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSend,
  onSendLike,
  onCancelEdit,
  onCancelReply,
  editingMessage,
  replyingTo,
  currentUserId,
  rateLimitError,
  isBlocked = false,
  blockedByMe = false,
}, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isBlocked) return;
    if (e.key === "Enter") onSend();
    if (e.key === "Escape" && editingMessage) onCancelEdit?.();
  };

  if (isBlocked) {
    return (
      <div className="border-t border-gray-100 bg-white safe-area-bottom shrink-0">
        <div className="flex items-center justify-center px-4 py-4 text-gray-500">
          <Icon name="block" size={18} className="mr-2 text-gray-400" />
          <span className="text-sm">
            {blockedByMe 
              ? "Bạn đã chặn người này. Bỏ chặn để tiếp tục nhắn tin." 
              : "Bạn không thể gửi tin nhắn cho người này."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-white safe-area-bottom shrink-0">
      {rateLimitError && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-500 text-center">
            <Icon name="error" size={14} className="inline mr-1" />
            {rateLimitError}
          </p>
        </div>
      )}
      
      {editingMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-600">
              <Icon name="edit" size={14} className="inline mr-1" />
              Đang chỉnh sửa tin nhắn
            </p>
            <p className="text-sm text-gray-500 truncate">{editingMessage.content}</p>
          </div>
          <button onClick={onCancelEdit} className="p-1 hover:bg-blue-100 rounded-full">
            <Icon name="close" size={18} className="text-blue-500" />
          </button>
        </div>
      )}
      
      {replyingTo && !editingMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#00b14f]">
              <Icon name="reply" size={14} className="inline mr-1" />
              Đang trả lời {replyingTo.sender.id === currentUserId ? "chính bạn" : replyingTo.sender.fullName}
            </p>
            <p className="text-sm text-gray-500 truncate">{replyingTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 rounded-full">
            <Icon name="close" size={18} className="text-gray-500" />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-2 mb-1 md:mb-1.5 mt-1">
        <button className="p-1.5 shrink-0">
          <Icon name="add_circle" size={22} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <button className="p-1.5 shrink-0">
          <Icon name="camera_alt" size={20} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <button className="p-1.5 shrink-0">
          <Icon name="image" size={20} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <button className="p-1.5 shrink-0">
          <Icon name="mic" size={20} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? "Nhập nội dung mới..." : "Aa"}
          className={`flex-1 rounded-full border-0 h-9 ${
            editingMessage 
              ? "bg-blue-50 focus-visible:ring-blue-500" 
              : "bg-gray-100 focus-visible:ring-[#00b14f]"
          }`}
        />
        {value.trim() ? (
          <button onClick={onSend} className="p-1.5 shrink-0">
            <Icon 
              name={editingMessage ? "check" : "send"} 
              size={20} 
              className={editingMessage ? "text-blue-500" : "text-[#00b14f]"} 
            />
          </button>
        ) : (
          <button onClick={onSendLike} className="p-1.5 shrink-0">
            <Icon name="thumb_up" size={22} className="text-[#00b14f]" />
          </button>
        )}
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
