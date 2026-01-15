"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { ChatConversation, ChatUserSearchResult } from "@/lib/api";

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  searchResults?: ChatUserSearchResult[];
  searchingUsers?: boolean;
  onSendFriendRequest?: (userId: number, message: string) => Promise<void>;
  onViewUserProfile?: (user: ChatUserSearchResult) => void;
  pendingRequests?: ChatConversation[];
  sentRequests?: ChatConversation[];
  onAcceptRequest?: (conversationId: number) => Promise<void>;
  onRejectRequest?: (conversationId: number) => Promise<void>;
  currentUserId?: number;
}
import MessagesLoading from "./shared/MessagesLoading";
import MessagesEmptyState from "./shared/MessagesEmptyState";
import ListHeader from "./list/ListHeader";
import ConversationItem from "./list/ConversationItem";
import SearchResults from "./list/SearchResults";
import PendingRequests from "./list/PendingRequests";
import SentRequests from "./list/SentRequests";

export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  searchQuery,
  onSearchChange,
  loading = false,
  searchResults = [],
  searchingUsers = false,
  onSendFriendRequest,
  onViewUserProfile,
  pendingRequests = [],
  sentRequests = [],
  onAcceptRequest,
  onRejectRequest,
  currentUserId = 0,
}: ConversationListProps) {
  const [sendingRequest, setSendingRequest] = useState<number | null>(null);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showUserSearchResults = searchQuery.length >= 3 && (searchResults.length > 0 || searchingUsers);
  
  const handleSendRequest = async (user: ChatUserSearchResult) => {
    if (!onSendFriendRequest || sendingRequest) return;
    
    setSendingRequest(user.id);
    try {
      await onSendFriendRequest(user.id, `Xin chào, mình muốn kết bạn với bạn!`);
    } finally {
      setSendingRequest(null);
    }
  };

  const handleAccept = async (conversationId: number) => {
    if (!onAcceptRequest || processingRequest) return;
    setProcessingRequest(conversationId);
    try {
      await onAcceptRequest(conversationId);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (conversationId: number) => {
    if (!onRejectRequest || processingRequest) return;
    setProcessingRequest(conversationId);
    try {
      await onRejectRequest(conversationId);
    } finally {
      setProcessingRequest(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ListHeader searchQuery={searchQuery} onSearchChange={onSearchChange} />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <MessagesLoading type="conversations" />
        ) : (
          <>
            {showUserSearchResults && (
              <SearchResults
                results={searchResults}
                loading={searchingUsers}
                sendingRequestId={sendingRequest}
                onSendRequest={handleSendRequest}
                onViewProfile={(user) => onViewUserProfile?.(user)}
              />
            )}

            {/* Pending Friend Requests */}
            {!searchQuery && (
              <PendingRequests
                requests={pendingRequests}
                processingId={processingRequest}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            )}

            {!searchQuery && <SentRequests requests={sentRequests} />}

            {(showUserSearchResults || pendingRequests.length > 0 || sentRequests.length > 0) && filteredConversations.length > 0 && !searchQuery && (
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase">Cuộc trò chuyện</p>
              </div>
            )}
            {showUserSearchResults && filteredConversations.length > 0 && searchQuery && (
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase">Cuộc trò chuyện</p>
              </div>
            )}

            {filteredConversations.length === 0 && !showUserSearchResults ? (
              <MessagesEmptyState
                icon="forum"
                message={searchQuery ? "Không tìm thấy cuộc trò chuyện" : "Chưa có cuộc hội thoại nào"}
              >
                {!searchQuery && (
                  <p className="text-xs text-gray-400 mt-1">Tìm kiếm email để thêm bạn mới</p>
                )}
              </MessagesEmptyState>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onSelect={onSelect}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
