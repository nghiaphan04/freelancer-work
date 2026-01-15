"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChatConversation, ChatMessage, ChatUserSearchResult, ChatMessageType } from "@/lib/api";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useChatActions } from "@/hooks/useChatActions";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput";
import MessageList from "./chat/MessageList";
import UserProfileView from "./profile/UserProfileView";

interface ChatBoxProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: number;
  onBack?: () => void;
  onSend?: (message: string, messageType?: ChatMessageType, fileId?: number, filePreview?: { url: string; size: number }) => void;
  onLoadMore?: () => void;
  onEditMessage?: (messageId: number, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: number) => Promise<void>;
  onReplyMessage?: (message: ChatMessage) => void;
  onStartEdit?: (message: ChatMessage) => void;
  onBlock?: (conversationId: number) => Promise<void>;
  onUnblock?: (conversationId: number) => Promise<void>;
  showBackButton?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  rateLimitError?: string | null;
}

export default function ChatBox({
  conversation,
  messages,
  currentUserId,
  onBack,
  onSend,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onStartEdit,
  onBlock,
  onUnblock,
  showBackButton = false,
  loading = false,
  hasMore = false,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  rateLimitError,
}: ChatBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    handleScroll,
    scrollToElement,
  } = useScrollPosition({
    onLoadMore,
    hasMore,
    loading,
    itemsLength: messages.length,
  });

  const {
    message,
    setMessage,
    hoveredMsgId,
    showMenuId,
    highlightedMsgId,
    expandedTimeIds,
    toggleTimeDisplay,
    highlightMessage,
    handleSend,
    handleDelete,
    handleReply,
    handleStartEdit,
    handleCancelEdit,
    handleMouseEnter,
    handleMouseLeave,
    toggleMenu,
    closeMenu,
  } = useChatActions({
    onSend,
    onEditMessage,
    onDeleteMessage,
    onReplyMessage,
    onStartEdit,
    onCancelEdit,
    onCancelReply,
  });

  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage, setMessage]);

  useEffect(() => {
    if (showMenuId !== null) {
      document.addEventListener("click", closeMenu);
      return () => document.removeEventListener("click", closeMenu);
    }
  }, [showMenuId, closeMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setShowProfileSidebar(false);
      }
    };
    if (showProfileSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileSidebar]);

  const scrollToMessage = (messageId: number) => {
    const messageEl = messageRefs.current.get(messageId);
    scrollToElement(messageEl || null);
    highlightMessage(messageId);
  };

  if (!conversation) {
    return null;
  }

  const user = conversation.otherUser;
  const isBlocked = conversation.status === "BLOCKED";
  const blockedByMe = isBlocked && conversation.blockedById === currentUserId;

  const userProfileData: ChatUserSearchResult = {
    id: user.id,
    fullName: user.fullName,
    email: user.email || "",
    avatarUrl: user.avatarUrl,
    canSendRequest: blockedByMe,
    relationStatus: isBlocked ? "BLOCKED" : "ACCEPTED",
    conversationId: conversation.id,
    trustScore: 0,
    untrustScore: 0,
  };

  return (
    <div className="flex-1 flex bg-white h-full relative">
      <div className={`flex-1 flex flex-col h-full ${showProfileSidebar ? "md:mr-80" : ""}`}>
        <ChatHeader
          user={user}
          showBackButton={showBackButton}
          showProfileActive={showProfileSidebar}
          onBack={onBack}
          onToggleProfile={() => setShowProfileSidebar(!showProfileSidebar)}
        />

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-4 py-4 scrollbar-hide bg-white"
        >
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            otherUser={user}
            loading={loading}
            hoveredMsgId={hoveredMsgId}
            showMenuId={showMenuId}
            highlightedMsgId={highlightedMsgId}
            expandedTimeIds={expandedTimeIds}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onToggleMenu={toggleMenu}
            onToggleTime={toggleTimeDisplay}
            onReply={handleReply}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
            onScrollToMessage={scrollToMessage}
            messageRefs={messageRefs}
            endRef={messagesEndRef}
          />
        </div>

        <ChatInput
          ref={inputRef}
          value={message}
          onChange={setMessage}
          onSend={() => handleSend(editingMessage)}
          onSendLike={() => onSend?.("👍", "LIKE")}
          onSendFile={(fileId, fileType, fileName, previewUrl, fileSize) => {
            const msgType = fileType === "IMAGE" ? "IMAGE" : "FILE";
            const filePreview = previewUrl && fileSize ? { url: previewUrl, size: fileSize } : undefined;
            onSend?.(fileName, msgType, fileId, filePreview);
          }}
          onCancelEdit={handleCancelEdit}
          onCancelReply={onCancelReply}
          editingMessage={editingMessage}
          replyingTo={replyingTo}
          currentUserId={currentUserId}
          rateLimitError={rateLimitError}
          isBlocked={isBlocked}
          blockedByMe={blockedByMe}
        />
      </div>

      {showProfileSidebar && (
        <>
          <div className="absolute inset-0 h-full w-full bg-white z-20 overflow-hidden md:hidden">
            <UserProfileView
              user={userProfileData}
              onBack={() => setShowProfileSidebar(false)}
              onBlock={onBlock}
              onUnblock={onUnblock}
              showBackButton={true}
              isSidebar={false}
            />
          </div>
          <div
            ref={sidebarRef}
            className="hidden md:block absolute right-0 top-0 h-full w-80 bg-white border-l border-gray-200 z-20 overflow-hidden"
          >
            <UserProfileView
              user={userProfileData}
              onBack={() => setShowProfileSidebar(false)}
              onBlock={onBlock}
              onUnblock={onUnblock}
              showBackButton={false}
              isSidebar={true}
            />
          </div>
        </>
      )}
    </div>
  );
}
