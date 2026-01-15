"use client";

import { getReplyLabel } from "@/lib/format";
import Icon from "@/components/ui/Icon";

interface ReplyInfo {
  id: number;
  content: string;
  sender: {
    id: number;
    fullName: string;
  };
  messageType?: string;
}

interface MessageReplyProps {
  replyTo: ReplyInfo;
  isMe: boolean;
  currentUserId: number;
  messageSenderId: number;
  messageSenderName: string;
  onScrollToMessage: (id: number) => void;
}

export default function MessageReply({
  replyTo,
  isMe,
  currentUserId,
  messageSenderId,
  messageSenderName,
  onScrollToMessage,
}: MessageReplyProps) {
  const replyLabel = getReplyLabel(
    isMe,
    replyTo.sender.id,
    currentUserId,
    messageSenderId,
    replyTo.sender.fullName,
    messageSenderName
  );

  const getReplyContent = () => {
    if (replyTo.messageType === "IMAGE") {
      return (
        <span className="flex items-center gap-1">
          <Icon name="image" size={14} />
          Hình ảnh
        </span>
      );
    }
    if (replyTo.messageType === "FILE") {
      return (
        <span className="flex items-center gap-1">
          <Icon name="attach_file" size={14} />
          {replyTo.content || "Tệp đính kèm"}
        </span>
      );
    }
    if (replyTo.messageType === "LIKE") {
      return (
        <span className="flex items-center gap-1">
          <Icon name="thumb_up" size={14} />
          Like
        </span>
      );
    }
    return replyTo.content;
  };

  return (
    <>
      <div 
        className={`text-xs mb-1 cursor-pointer hover:opacity-70 ${isMe ? "text-right" : "text-left"} text-gray-500`}
        onClick={(e) => { e.stopPropagation(); onScrollToMessage(replyTo.id); }}
      >
        ↩ {replyLabel}
      </div>
      
      <div 
        className={`w-fit px-3 py-2 rounded-2xl cursor-pointer hover:opacity-80 ${
          isMe 
            ? "bg-[#008c3f] text-white/80 rounded-br-lg" 
            : "bg-gray-200 text-gray-600 rounded-bl-lg"
        }`}
        onClick={(e) => { e.stopPropagation(); onScrollToMessage(replyTo.id); }}
      >
        <p className="text-sm break-words">{getReplyContent()}</p>
      </div>
    </>
  );
}
