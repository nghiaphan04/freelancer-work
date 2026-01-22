"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ChatMessage, ChatConversation, ChatUserSearchResult } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useConversations } from "@/hooks/useConversations";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import ConversationList from "./ConversationList";
import ChatBox from "./ChatBox";
import UserProfileView from "./profile/UserProfileView";
import { toast } from "sonner";

// Custom hooks
import { useMessages } from "@/hooks/useMessages";
import { useUserSearch } from "@/hooks/useUserSearch";

export default function MessagesContainer() {
  const { user } = useAuth();

  const {
    conversations,
    setConversations,
    selectedId,
    setSelectedId,
    selectedConversation,
    loading,
    showMobileChat,
    setShowMobileChat,
    selectConversation,
    goBack,
    handleNewMessage: updateConversationOnNewMessage,
    handleConversationUpdated,
    handleMessageStatus,
    updateOnlineStatus: updateConversationOnlineStatus,
    resetUnreadCount,
  } = useConversations();

  const {
    pendingRequests,
    setPendingRequests,
    sentRequests,
    setSentRequests,
    searchResults,
    setSearchResults,
    viewingProfile,
    setViewingProfile,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser,
    updateOnlineStatus: updateFriendOnlineStatus,
  } = useFriendRequests({
    onConversationsChange: setConversations,
    selectedId,
    onSelectedIdChange: setSelectedId,
    onShowMobileChatChange: setShowMobileChat,
  });

  // WebSocket connection state (needed before useMessages)
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSendFn, setWsSendFn] = useState<any>(null);

  // Messages hook
  const {
    messages,
    messagesLoading,
    hasMore,
    rateLimitError,
    replyingTo,
    editingMessage,
    fetchMessages,
    handleLoadMore,
    handleNewMessage,
    handleRateLimitError,
    handleReplyMessage,
    handleStartEdit,
    handleEditMessage,
    handleDeleteMessage,
    handleSend,
    setReplyingTo,
    setEditingMessage,
  } = useMessages({
    selectedId,
    selectedConversation,
    user,
    connected: wsConnected,
    wsSendMessage: wsSendFn || (() => {}),
    setConversations,
    resetUnreadCount,
  });

  // User search hook
  const {
    searchQuery,
    setSearchQuery,
    searchingUsers,
    clearSearch,
  } = useUserSearch({
    sentRequests,
    pendingRequests,
    conversations,
    setSearchResults,
  });

  // Handle WebSocket events
  const handleWsNewMessage = useCallback((message: ChatMessage) => {
    const isSelected = message.conversationId === selectedId;
    handleNewMessage(message, isSelected);
    updateConversationOnNewMessage(message, isSelected);
  }, [selectedId, handleNewMessage, updateConversationOnNewMessage]);

  const handleOnlineStatus = useCallback((data: { userId: number; online: boolean; lastActiveAt?: string }) => {
    updateConversationOnlineStatus(data.userId, data.online, data.lastActiveAt);
    updateFriendOnlineStatus(data.userId, data.online, data.lastActiveAt);
  }, [updateConversationOnlineStatus, updateFriendOnlineStatus]);

  const handleWsRateLimitError = useCallback((data: { type: string; message: string }) => {
    handleRateLimitError(data.message);
  }, [handleRateLimitError]);

  const handleRequestAccepted = useCallback((conversation: ChatConversation) => {
    setSentRequests(prev => prev.filter(c => c.id !== conversation.id));
    setConversations(prev => {
      if (prev.some(c => c.id === conversation.id)) return prev;
      return [conversation, ...prev];
    });
    setSearchResults(prev => prev.map(u => 
      u.id === conversation.otherUser.id 
        ? { ...u, relationStatus: "ACCEPTED" as const, conversationId: conversation.id }
        : u
    ));
    setViewingProfile(prev => 
      prev?.id === conversation.otherUser.id 
        ? { ...prev, relationStatus: "ACCEPTED" as const, conversationId: conversation.id }
        : prev
    );
    toast.success(`${conversation.otherUser.fullName} đã chấp nhận lời mời kết bạn!`);
  }, [setSentRequests, setConversations, setSearchResults, setViewingProfile]);

  const { connected, sendMessage: wsSendMessage } = useChatSocket({
    onNewMessage: handleWsNewMessage,
    onConversationUpdated: handleConversationUpdated,
    onOnlineStatus: handleOnlineStatus,
    onMessageStatus: handleMessageStatus,
    onRateLimitError: handleWsRateLimitError,
    onRequestAccepted: handleRequestAccepted,
  });

  // Update connection state for useMessages hook
  useEffect(() => {
    setWsConnected(connected);
    setWsSendFn(() => wsSendMessage);
  }, [connected, wsSendMessage]);

  // Fetch friend requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const [pendingRes, sentRes] = await Promise.all([
          api.getPendingChatRequests(),
          api.getSentChatRequests(),
        ]);
        if (pendingRes.status === "SUCCESS") setPendingRequests(pendingRes.data);
        if (sentRes.status === "SUCCESS") setSentRequests(sentRes.data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      }
    };
    fetchRequests();
  }, [setPendingRequests, setSentRequests]);

  // Fetch messages when conversation changes
  useEffect(() => {
    fetchMessages();
  }, [selectedId, fetchMessages]);

  // Handlers
  const handleSendFriendRequest = useCallback(async (userId: number, message: string) => {
    const success = await sendFriendRequest(userId, message);
    if (success) clearSearch();
  }, [sendFriendRequest, clearSearch]);

  const handleViewUserProfile = useCallback((u: ChatUserSearchResult) => {
    setViewingProfile({
      ...u,
      canSendRequest: u.canSendRequest &&
        !sentRequests.some(req => req.otherUser.id === u.id) &&
        !pendingRequests.some(req => req.otherUser.id === u.id) &&
        !conversations.some(conv => conv.otherUser.id === u.id),
    });
    setSelectedId(null);
    setShowMobileChat(true);
  }, [sentRequests, pendingRequests, conversations, setViewingProfile, setSelectedId, setShowMobileChat]);

  const handleCloseProfile = useCallback(() => {
    setViewingProfile(null);
    if (window.innerWidth < 768) setShowMobileChat(false);
  }, [setViewingProfile, setShowMobileChat]);

  const handleSelectConversation = useCallback((id: number) => {
    selectConversation(id);
    setViewingProfile(null);
  }, [selectConversation, setViewingProfile]);

  const handleBack = useCallback(() => {
    goBack();
    setViewingProfile(null);
  }, [goBack, setViewingProfile]);

  return (
    <div className={`bg-white md:h-full overflow-hidden ${showMobileChat ? "h-[100dvh] fixed inset-0 z-[9999] md:relative md:z-auto" : "h-[calc(100dvh-64px)]"}`}>
      <div className="flex h-full">
        <div className={`w-full md:w-96 lg:w-[400px] md:border-r border-gray-200 ${showMobileChat ? "hidden md:block" : "block"}`}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={loading}
            searchResults={searchResults}
            searchingUsers={searchingUsers}
            onSendFriendRequest={handleSendFriendRequest}
            onViewUserProfile={handleViewUserProfile}
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
            onAcceptRequest={async (id) => { await acceptFriendRequest(id); }}
            onRejectRequest={async (id) => { await rejectFriendRequest(id); }}
            currentUserId={user?.id || 0}
          />
        </div>

        <div className={`w-full md:w-auto flex-1 ${!showMobileChat ? "hidden md:flex" : "flex"} md:relative bg-white`}>
          {viewingProfile ? (
            <UserProfileView
              user={viewingProfile}
              onBack={handleCloseProfile}
              onSendFriendRequest={handleSendFriendRequest}
              onCancelRequest={async (id) => { await cancelFriendRequest(id); }}
              onBlock={async (id) => { await blockUser(id, user?.id); }}
              showBackButton={showMobileChat}
            />
          ) : (
            <ChatBox
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user?.id || 0}
              onBack={handleBack}
              onSend={handleSend}
              onLoadMore={handleLoadMore}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReplyMessage={handleReplyMessage}
              onStartEdit={handleStartEdit}
              onBlock={async (id) => { await blockUser(id, user?.id); }}
              onUnblock={async (id) => { await unblockUser(id); }}
              showBackButton={showMobileChat}
              loading={messagesLoading}
              hasMore={hasMore}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              rateLimitError={rateLimitError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
