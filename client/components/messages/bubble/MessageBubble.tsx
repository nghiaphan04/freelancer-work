"use client";

import Icon from "@/components/ui/Icon";
import { ChatMessage } from "@/lib/api";
import { formatTime, getMessageStatusIcon } from "@/lib/format";
import MessageReply from "./MessageReply";

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  currentUserId: number;
  showTimeAndTick: boolean;
  isLastMessage: boolean;
  onToggleTime: () => void;
  onScrollToMessage: (id: number) => void;
}

export default function MessageBubble({
  message,
  isMe,
  currentUserId,
  showTimeAndTick,
  isLastMessage,
  onToggleTime,
  onScrollToMessage,
}: MessageBubbleProps) {
  const isFailed = message.status === "FAILED";
  const isLikeMessage = message.messageType === "LIKE";
  
  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] md:max-w-[85%] lg:max-w-[80%] min-w-0 ${isFailed ? "opacity-60 animate-pulse" : ""}`}>
      {message.replyTo && (
        <MessageReply
          replyTo={message.replyTo}
          isMe={isMe}
          currentUserId={currentUserId}
          messageSenderId={message.sender.id}
          messageSenderName={message.sender.fullName}
          onScrollToMessage={onScrollToMessage}
        />
      )}
      
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {isLikeMessage ? (
          <div
            className={`${message.replyTo ? "-mt-2 relative z-10" : ""} ${!isLastMessage ? "cursor-pointer" : ""}`}
            onClick={() => !isLastMessage && onToggleTime()}
          >
            <Icon name="thumb_up" size={32} className="text-[#00b14f]" />
          </div>
        ) : (
          <div
            className={`w-fit px-4 py-2.5 rounded-3xl ${
              isFailed
                ? "bg-red-400 text-white"
                : isMe
                  ? "bg-[#00b14f] text-white"
                  : "bg-gray-100 text-gray-900"
            } ${message.replyTo ? "-mt-2 relative z-10" : ""} ${!isLastMessage ? "cursor-pointer" : ""}`}
            onClick={() => !isLastMessage && onToggleTime()}
          >
            <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
          </div>
        )}
      </div>

      {isFailed ? (
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <Icon name="error" size={12} className="text-red-500" />
          <span className="text-[10px] text-red-500">Gửi thất bại</span>
        </div>
      ) : showTimeAndTick && (
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-400">
            {formatTime(message.createdAt)}
            {message.isEdited && " (đã sửa)"}
          </span>
          {isMe && (
            <Icon 
              name={getMessageStatusIcon(message.status)} 
              size={12} 
              className={message.status === "READ" ? "text-blue-500" : "text-gray-400"}
            />
          )}
        </div>
      )}
    </div>
  );
}
