"use client";

import Icon from "@/components/ui/Icon";
import { ChatMessage } from "@/lib/api";
import { formatTime, getMessageStatusIcon } from "@/lib/format";
import MessageReply from "./MessageReply";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  const isFailed = message.status === "FAILED";
  const isLikeMessage = message.messageType === "LIKE";
  const isImageMessage = message.messageType === "IMAGE" && message.file;
  const isFileMessage = message.messageType === "FILE" && message.file;

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderImageMessage = () => {
    if (!message.file) return null;
    
    const { secureUrl, width, height, originalFilename } = message.file;
    const aspectRatio = width && height ? width / height : 1;
    const maxWidth = 280;
    const maxHeight = 320;
    
    let displayWidth = maxWidth;
    let displayHeight = maxWidth / aspectRatio;
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = maxHeight * aspectRatio;
    }

    const fullImageModal = showFullImage && typeof document !== "undefined" ? createPortal(
      <div 
        className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setShowFullImage(false)}
      >
        <button 
          className="absolute top-4 right-4 text-white hover:text-white/70"
          onClick={() => setShowFullImage(false)}
        >
          <Icon name="close" size={28} />
        </button>
        <button 
          className="absolute top-4 left-4 text-white hover:text-white/70"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(secureUrl, originalFilename);
          }}
        >
          <Icon name="download" size={28} />
        </button>
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <Image
            src={secureUrl}
            alt={originalFilename}
            width={width || 800}
            height={height || 600}
            className="object-contain max-h-[90vh]"
          />
        </div>
      </div>,
      document.body
    ) : null;

    return (
      <>
        <div
          className={`relative rounded-2xl overflow-hidden cursor-pointer ${
            message.replyTo ? "-mt-2 relative z-10" : ""
          } ${!imageLoaded ? "bg-gray-200 animate-pulse" : ""}`}
          style={{ width: displayWidth, height: displayHeight }}
          onClick={() => setShowFullImage(true)}
        >
          <Image
            src={secureUrl}
            alt={originalFilename}
            fill
            className="object-cover"
            onLoad={() => setImageLoaded(true)}
            sizes="280px"
          />
        </div>
        {fullImageModal}
      </>
    );
  };

  const renderFileMessage = () => {
    if (!message.file) return null;
    
    const { secureUrl, originalFilename } = message.file;
    
    return (
      <div
        className={`flex items-center gap-2 max-w-[280px] ${message.replyTo ? "-mt-2 relative z-10" : ""} ${!isLastMessage ? "cursor-pointer" : ""}`}
        onClick={() => !isLastMessage && onToggleTime()}
      >
        <Icon 
          name="picture_as_pdf" 
          size={28} 
          className="text-red-500" 
        />
        <span className="text-sm text-gray-800 truncate">
          {originalFilename}
        </span>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(secureUrl, originalFilename);
          }}
        >
          <Icon name="download" size={20} />
        </button>
      </div>
    );
  };

  const renderTextMessage = () => (
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
  );
  
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
        ) : isImageMessage ? (
          renderImageMessage()
        ) : isFileMessage ? (
          renderFileMessage()
        ) : (
          renderTextMessage()
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
