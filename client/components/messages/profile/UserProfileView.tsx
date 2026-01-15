"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatUserSearchResult } from "@/lib/api";

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

function ExpandableText({ text, maxLines = 3, className = "" }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      const lineHeight = parseInt(getComputedStyle(element).lineHeight) || 20;
      const maxHeight = lineHeight * maxLines;
      setIsOverflowing(element.scrollHeight > maxHeight);
    }
  }, [text, maxLines]);

  return (
    <div>
      <p
        ref={textRef}
        className={`text-gray-700 text-sm whitespace-pre-wrap ${className} ${
          !isExpanded && isOverflowing ? `line-clamp-${maxLines}` : ""
        }`}
        style={!isExpanded && isOverflowing ? { 
          display: "-webkit-box",
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        } : {}}
      >
        {text}
      </p>
      {isOverflowing && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#00b14f] text-sm font-medium mt-1 hover:underline"
        >
          {isExpanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
}

interface UserProfileViewProps {
  user: ChatUserSearchResult & { conversationId?: number };
  onBack?: () => void;
  onSendFriendRequest?: (userId: number, message: string) => Promise<void>;
  onCancelRequest?: (conversationId: number) => Promise<void>;
  onBlock?: (conversationId: number) => Promise<void>;
  onUnblock?: (conversationId: number) => Promise<void>;
  showBackButton?: boolean;
  isSidebar?: boolean;
}

export default function UserProfileView({
  user,
  onBack,
  onSendFriendRequest,
  onCancelRequest,
  onBlock,
  onUnblock,
  showBackButton = false,
  isSidebar = false,
}: UserProfileViewProps) {
  const [sendingRequest, setSendingRequest] = useState(false);
  const [localRelationStatus, setLocalRelationStatus] = useState(user.relationStatus);

  useEffect(() => {
    setLocalRelationStatus(user.relationStatus);
  }, [user.id, user.relationStatus]);

  const handleSendRequest = async () => {
    if (!onSendFriendRequest || sendingRequest || !user.canSendRequest) return;
    
    setSendingRequest(true);
    try {
      await onSendFriendRequest(user.id, `Xin chào, mình muốn kết bạn với bạn!`);
      setLocalRelationStatus("PENDING");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!onCancelRequest || !user.conversationId || sendingRequest) return;
    
    setSendingRequest(true);
    try {
      await onCancelRequest(user.conversationId);
      setLocalRelationStatus("NONE");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBlock = async () => {
    if (!onBlock || !user.conversationId || sendingRequest) return;
    
    setSendingRequest(true);
    try {
      await onBlock(user.conversationId);
      setLocalRelationStatus("BLOCKED");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleUnblock = async () => {
    if (!onUnblock || !user.conversationId || sendingRequest) return;
    
    setSendingRequest(true);
    try {
      await onUnblock(user.conversationId);
      setLocalRelationStatus("NONE");
    } finally {
      setSendingRequest(false);
    }
  };

  const renderActionButtons = (size: "sm" | "default" = "default") => {
    const isSmall = size === "sm";
    const status = localRelationStatus || user.relationStatus;

    if (status === "ACCEPTED") {
      return (
        <>
          <Button 
            variant="outline"
            size={isSmall ? "sm" : "default"}
            className={`shrink-0 ${isSmall ? "" : "px-4 h-10"}`}
            disabled
          >
            <Icon name="check_circle" size={isSmall ? 16 : 18} className="mr-1" />
            Đã kết bạn
          </Button>
          <Button 
            variant="outline"
            onClick={handleBlock}
            size={isSmall ? "sm" : "default"} 
            className={`shrink-0 disabled:opacity-50 ${isSmall ? "" : "px-4 h-10"}`}
            disabled={sendingRequest || !user.conversationId}
          >
            <Icon name="block" size={isSmall ? 16 : 18} className={isSmall ? "mr-1" : "mr-1.5"} />
            Chặn
          </Button>
        </>
      );
    }

    if (status === "BLOCKED") {
      if (user.canSendRequest) {
        return (
          <Button 
            variant="outline"
            onClick={handleUnblock}
            disabled={sendingRequest}
            size={isSmall ? "sm" : "default"}
            className={`shrink-0 text-[#00b14f] border-[#00b14f] hover:bg-[#00b14f]/5 ${isSmall ? "" : "px-4 h-10"}`}
          >
            <Icon name="lock_open" size={isSmall ? 16 : 18} className="mr-1" />
            Bỏ chặn
          </Button>
        );
      }
      return (
        <Button 
          variant="outline" 
          disabled 
          size={isSmall ? "sm" : "default"}
          className={`shrink-0 ${isSmall ? "" : "px-4 h-10"}`}
        >
          <Icon name="block" size={isSmall ? 16 : 18} className="mr-1" />
          Đã bị chặn
        </Button>
      );
    }

    if (status === "PENDING") {
      return (
        <>
          <Button 
            variant="outline"
            onClick={handleCancelRequest}
            disabled={sendingRequest}
            size={isSmall ? "sm" : "default"}
            className={`shrink-0 disabled:opacity-50 ${isSmall ? "" : "px-4 h-10"}`}
          >
            <Icon name="close" size={isSmall ? 16 : 18} className="mr-1" />
            Hủy gửi
          </Button>
          <Button 
            variant="outline"
            onClick={handleBlock}
            size={isSmall ? "sm" : "default"} 
            className={`shrink-0 disabled:opacity-50 ${isSmall ? "" : "px-4 h-10"}`}
            disabled={sendingRequest || !user.conversationId}
          >
            <Icon name="block" size={isSmall ? 16 : 18} className={isSmall ? "mr-1" : "mr-1.5"} />
            Chặn
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          variant="outline"
          onClick={handleSendRequest}
          disabled={sendingRequest}
          size={isSmall ? "sm" : "default"}
          className={`shrink-0 disabled:opacity-50 ${isSmall ? "" : "px-4 h-10"}`}
        >
          <Icon name="person_add" size={isSmall ? 16 : 18} className={isSmall ? "mr-1" : "mr-1.5"} />
          Kết bạn
        </Button>
        <Button 
          variant="outline"
          onClick={handleBlock}
          size={isSmall ? "sm" : "default"} 
          className={`shrink-0 disabled:opacity-50 ${isSmall ? "" : "px-4 h-10"}`} 
          disabled={sendingRequest || !user.conversationId}
        >
          <Icon name="block" size={isSmall ? 16 : 18} className={isSmall ? "mr-1" : "mr-1.5"} />
          Chặn
        </Button>
      </>
    );
  };

  if (isSidebar) {
    return (
      <div className="flex flex-col bg-white h-full">
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200">
          <div className="flex items-center gap-2 px-4 py-3">
            <h2 className="font-semibold text-gray-900 flex-1">Thông tin</h2>
            <button onClick={onBack} className="p-1">
              <Icon name="close" size={20} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col items-center py-6 px-4">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
                {user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-lg font-bold text-gray-900 mb-1 text-center">{user.fullName}</h1>
            <p className="text-gray-500 mb-3 text-sm">{user.email}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Icon name="verified" size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">{user.trustScore ?? 0} UT</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="dangerous" size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-600">{user.untrustScore ?? 0} KUT</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {renderActionButtons("sm")}
            </div>

            <div className="w-full space-y-3 mt-2">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Giới thiệu</h3>
                <ExpandableText 
                  text={user.bio || "Chưa có thông tin giới thiệu"} 
                  maxLines={3} 
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Thông tin liên hệ</h3>
                <div className="flex items-center gap-3">
                  <Icon name="email" size={18} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 text-sm truncate">{user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 safe-area-top">
        <div className="flex items-center gap-2 px-2 md:px-4 py-3 mt-1 md:mt-1.5 md:mb-1">
          {/* Back button on mobile */}
          {showBackButton && (
            <button 
              onClick={onBack} 
              className="p-2 active:bg-gray-100 rounded-full md:hidden"
            >
              <Icon name="arrow_back" size={24} className="text-gray-700" />
            </button>
          )}
          <h2 className="font-semibold text-gray-900 flex-1">Thông tin người dùng</h2>
          {/* Close button on desktop */}
          <button 
            onClick={onBack} 
            className="p-1 hidden md:block"
          >
            <Icon name="close" size={22} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>

      {/* Mobile Content - vertical layout */}
      <div className="flex-1 overflow-y-auto md:hidden scrollbar-thin">
        <div className="flex flex-col items-center py-6 px-4">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-3xl">
              {user.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">{user.fullName}</h1>
          <p className="text-gray-500 mb-4 text-sm">{user.email}</p>

          <div className="flex items-center gap-6 mb-5">
            <div className="flex items-center gap-1.5">
              <Icon name="verified" size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">{user.trustScore ?? 0} UT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="dangerous" size={18} className="text-red-500" />
              <span className="text-sm font-medium text-red-600">{user.untrustScore ?? 0} KUT</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {renderActionButtons("default")}
          </div>

          <div className="w-full space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Giới thiệu</h3>
              <ExpandableText 
                text={user.bio || "Chưa có thông tin giới thiệu"} 
                maxLines={3} 
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Thông tin liên hệ</h3>
              <div className="flex items-center gap-3">
                <Icon name="email" size={20} className="text-gray-400 shrink-0" />
                <span className="text-gray-700 text-sm truncate">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Content - horizontal layout */}
      <div className="hidden md:flex flex-1 p-6 gap-6 overflow-hidden">
        {/* Left side - Profile info */}
        <div className="flex flex-col items-center w-64 shrink-0 pt-2">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-3xl">
              {user.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-lg font-bold text-gray-900 mb-1 text-center">{user.fullName}</h1>
          <p className="text-gray-500 mb-3 text-sm">{user.email}</p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Icon name="verified" size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">{user.trustScore ?? 0} UT</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="dangerous" size={16} className="text-red-500" />
              <span className="text-sm font-medium text-red-600">{user.untrustScore ?? 0} KUT</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {renderActionButtons("sm")}
          </div>
        </div>

        {/* Right side - Info cards */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Giới thiệu</h3>
              <ExpandableText 
                text={user.bio || "Chưa có thông tin giới thiệu"} 
                maxLines={4} 
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Thông tin liên hệ</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Icon name="email" size={18} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 text-sm truncate">{user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
