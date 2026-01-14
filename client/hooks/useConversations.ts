"use client";

import { useState, useCallback, useEffect } from "react";
import { api, ChatConversation, ChatMessage } from "@/lib/api";
import { toast } from "sonner";

export function useConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const selectedConversation = conversations.find(c => c.id === selectedId) || null;

  const sortByNewest = useCallback((list: ChatConversation[]) => {
    return [...list].sort((a, b) =>
      new Date(b.lastMessageTime || b.createdAt).getTime() -
      new Date(a.lastMessageTime || a.createdAt).getTime()
    );
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await api.getConversations();
        if (res.status === "SUCCESS") {
          const sorted = sortByNewest(res.data);
          setConversations(sorted);
          if (sorted.length > 0 && !selectedId) {
            setSelectedId(sorted[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        toast.error("Không thể tải danh sách hội thoại");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [sortByNewest]);

  const selectConversation = useCallback((id: number) => {
    setSelectedId(id);
    setShowMobileChat(true);
  }, []);

  const goBack = useCallback(() => {
    setShowMobileChat(false);
  }, []);

  const handleNewMessage = useCallback((message: ChatMessage, isSelected: boolean) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageType: message.messageType,
            lastMessageDeleted: false,
            lastMessageTime: message.createdAt,
            lastMessageSenderId: message.sender.id,
            lastMessageStatus: message.status,
            unreadCount: isSelected ? 0 : conv.unreadCount + 1,
          };
        }
        return conv;
      });
      return sortByNewest(updated);
    });
  }, [sortByNewest]);

  const handleConversationUpdated = useCallback((conversation: ChatConversation) => {
    setConversations(prev => {
      const exists = prev.find(c => c.id === conversation.id);
      let updated;
      if (exists) {
        updated = prev.map(c => {
          if (c.id === conversation.id) {
            return {
              ...conversation,
              otherUser: {
                ...conversation.otherUser,
                online: c.otherUser.online,
                lastActiveAt: c.otherUser.lastActiveAt || conversation.otherUser.lastActiveAt,
              },
            };
          }
          return c;
        });
      } else {
        updated = [conversation, ...prev];
      }
      return sortByNewest(updated);
    });
  }, [sortByNewest]);

  const handleMessageStatus = useCallback((data: { conversationId: number; status: string }) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === data.conversationId) {
          return {
            ...conv,
            lastMessageStatus: data.status as ChatConversation["lastMessageStatus"],
          };
        }
        return conv;
      })
    );
  }, []);

  const updateOnlineStatus = useCallback((userId: number, online: boolean, lastActiveAt?: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.otherUser.id === userId) {
          return {
            ...conv,
            otherUser: {
              ...conv.otherUser,
              online,
              lastActiveAt: lastActiveAt || conv.otherUser.lastActiveAt,
            },
          };
        }
        return conv;
      })
    );
  }, []);

  const resetUnreadCount = useCallback((conversationId: number) => {
    setConversations(prev =>
      prev.map(conv => conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv)
    );
  }, []);

  return {
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
    handleNewMessage,
    handleConversationUpdated,
    handleMessageStatus,
    updateOnlineStatus,
    resetUnreadCount,
  };
}
