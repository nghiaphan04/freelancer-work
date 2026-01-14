"use client";

import { ChatConversation } from "@/lib/api";
import UserAvatar from "../shared/UserAvatar";
import Icon from "@/components/ui/Icon";
import { formatRelativeTime } from "@/lib/format";

interface ConversationItemProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onSelect: (id: number) => void;
  currentUserId: number;
}

export default function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  currentUserId,
}: ConversationItemProps) {
  const { otherUser, unreadCount, lastMessage, lastMessageType, lastMessageDeleted, firstMessage, lastMessageSenderId, lastMessageTime, status, blockedById } = conversation;
  const lastActiveTime = otherUser.lastActiveAt ? formatRelativeTime(otherUser.lastActiveAt) : null;
  const isMyMessage = lastMessageSenderId === currentUserId;
  const messageTime = lastMessageTime ? formatRelativeTime(lastMessageTime) : null;
  const isLikeMessage = lastMessageType === "LIKE";
  const isImageMessage = lastMessageType === "IMAGE";
  const isFileMessage = lastMessageType === "FILE";
  const isBlocked = status === "BLOCKED";
  const blockedByMe = isBlocked && blockedById === currentUserId;
  
  const getDisplayMessage = () => {
    if (isBlocked) return blockedByMe ? "Bạn đã chặn người này" : "Bạn đã bị chặn";
    if (lastMessageDeleted) return "Tin nhắn đã bị xóa";
    if (isLikeMessage) return "Đã gửi một lượt thích";
    if (isImageMessage) return "Hình ảnh";
    if (isFileMessage) return "Tệp đính kèm";
    return lastMessage;
  };
  
  const displayMessage = getDisplayMessage();

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 md:py-2.5 active:bg-gray-100 md:hover:bg-gray-50 transition-colors ${
        isSelected ? "md:bg-[#00b14f]/5" : ""
      } ${isBlocked ? "opacity-60" : ""}`}
    >
      <div className="relative">
        <UserAvatar
          src={otherUser.avatarUrl}
          name={otherUser.fullName}
          online={isBlocked ? false : otherUser.online}
          size="xl"
          showOnlineStatus={!isBlocked}
        />
        {isBlocked ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
            <Icon name="block" size={10} />
          </span>
        ) : !otherUser.online && lastActiveTime ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 bg-white px-1 rounded whitespace-nowrap">
            {lastActiveTime}
          </span>
        ) : null}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <span className={`font-semibold md:font-medium truncate text-base md:text-sm ${
          isBlocked ? "text-gray-500" : unreadCount > 0 ? "text-gray-900" : "text-gray-700"
        }`}>
          {otherUser.fullName}
        </span>
        <p className={`text-sm truncate mt-0.5 flex items-center gap-1 ${
          isBlocked ? "text-gray-400" : unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
        }`}>
          <span className="truncate">
            {displayMessage
              ? (isBlocked ? displayMessage : `${isMyMessage ? "Bạn: " : ""}${displayMessage}`)
              : firstMessage || "Bắt đầu cuộc trò chuyện"
            }
          </span>
          {!isBlocked && messageTime && (
            <span className="text-xs text-gray-400 shrink-0">· {messageTime}</span>
          )}
        </p>
      </div>
      
      {!isBlocked && unreadCount > 0 && (
        <span className="w-5 h-5 bg-[#00b14f] text-white text-xs rounded-full flex items-center justify-center shrink-0">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
