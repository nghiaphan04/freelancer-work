"use client";

import { useState, useCallback } from "react";
import { api, ChatConversation, ChatUserSearchResult } from "@/lib/api";
import { toast } from "sonner";

interface UseFriendRequestsOptions {
  onConversationsChange?: (updater: (prev: ChatConversation[]) => ChatConversation[]) => void;
  selectedId?: number | null;
  onSelectedIdChange?: (id: number | null) => void;
  onShowMobileChatChange?: (show: boolean) => void;
}

export function useFriendRequests({
  onConversationsChange,
  selectedId,
  onSelectedIdChange,
  onShowMobileChatChange,
}: UseFriendRequestsOptions = {}) {
  const [pendingRequests, setPendingRequests] = useState<ChatConversation[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatConversation[]>([]);
  const [searchResults, setSearchResults] = useState<ChatUserSearchResult[]>([]);
  const [viewingProfile, setViewingProfile] = useState<ChatUserSearchResult | null>(null);

  const sendFriendRequest = useCallback(async (userId: number, message: string) => {
    try {
      const res = await api.sendChatRequest(userId, message);

      if (res.status === "SUCCESS") {
        const isUnblocking = res.data.status === "ACCEPTED";
        
        if (isUnblocking) {
          toast.success("Đã bỏ chặn người dùng!");
          onConversationsChange?.(prev => prev.map(c => 
            c.id === res.data.id 
              ? { ...res.data, otherUser: { ...res.data.otherUser, online: c.otherUser.online, lastActiveAt: c.otherUser.lastActiveAt } } 
              : c
          ));
          setSearchResults(prev =>
            prev.map(u => u.id === userId 
              ? { ...u, canSendRequest: false, relationStatus: "ACCEPTED" as const, conversationId: res.data.id } 
              : u
            )
          );
          setViewingProfile(prev =>
            prev?.id === userId 
              ? { ...prev, canSendRequest: false, relationStatus: "ACCEPTED" as const, conversationId: res.data.id } 
              : prev
          );
        } else {
          toast.success("Đã gửi yêu cầu kết bạn!");
          setSearchResults(prev =>
            prev.map(u => u.id === userId 
              ? { ...u, canSendRequest: false, relationStatus: "PENDING" as const, conversationId: res.data.id } 
              : u
            )
          );
          setViewingProfile(prev =>
            prev?.id === userId 
              ? { ...prev, canSendRequest: false, relationStatus: "PENDING" as const, conversationId: res.data.id } 
              : prev
          );
          setSentRequests(prev => {
            const exists = prev.find(c => c.id === res.data.id);
            return exists ? prev : [res.data, ...prev];
          });
        }
        return true;
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu kết bạn");
        return false;
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error("Không thể gửi yêu cầu kết bạn");
      return false;
    }
  }, [onConversationsChange]);

  const cancelFriendRequest = useCallback(async (conversationId: number) => {
    try {
      const res = await api.cancelChatRequest(conversationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã hủy yêu cầu kết bạn!");
        setSentRequests(prev => prev.filter(c => c.id !== conversationId));
        setSearchResults(prev =>
          prev.map(u => u.conversationId === conversationId
            ? { ...u, canSendRequest: true, relationStatus: "NONE" as const, conversationId: undefined }
            : u
          )
        );
        setViewingProfile(prev =>
          prev?.conversationId === conversationId
            ? { ...prev, canSendRequest: true, relationStatus: "NONE" as const, conversationId: undefined }
            : prev
        );
        return true;
      } else {
        toast.error(res.message || "Không thể hủy yêu cầu");
        return false;
      }
    } catch (error) {
      console.error("Failed to cancel request:", error);
      toast.error("Không thể hủy yêu cầu");
      return false;
    }
  }, []);

  const acceptFriendRequest = useCallback(async (conversationId: number) => {
    try {
      const res = await api.acceptChatRequest(conversationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã chấp nhận yêu cầu kết bạn!");
        setPendingRequests(prev => prev.filter(r => r.id !== conversationId));
        onConversationsChange?.(prev => [res.data, ...prev]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Không thể chấp nhận yêu cầu");
      return false;
    }
  }, [onConversationsChange]);

  const rejectFriendRequest = useCallback(async (conversationId: number) => {
    try {
      const res = await api.rejectChatRequest(conversationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã từ chối yêu cầu kết bạn");
        setPendingRequests(prev => prev.filter(r => r.id !== conversationId));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast.error("Không thể từ chối yêu cầu");
      return false;
    }
  }, []);

  const blockUser = useCallback(async (conversationId: number, currentUserId?: number) => {
    try {
      const res = await api.blockUser(conversationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã chặn người dùng!");
        onConversationsChange?.(prev => prev.map(c => 
          c.id === conversationId 
            ? { ...c, status: "BLOCKED" as const, blockedById: currentUserId } 
            : c
        ));
        setSearchResults(prev =>
          prev.map(u => u.conversationId === conversationId
            ? { ...u, canSendRequest: true, relationStatus: "BLOCKED" as const }
            : u
          )
        );
        setViewingProfile(prev =>
          prev?.conversationId === conversationId
            ? { ...prev, canSendRequest: true, relationStatus: "BLOCKED" as const }
            : prev
        );
        return true;
      } else {
        toast.error(res.message || "Không thể chặn người dùng");
        return false;
      }
    } catch (error) {
      console.error("Failed to block:", error);
      toast.error("Không thể chặn người dùng");
      return false;
    }
  }, [onConversationsChange]);

  const unblockUser = useCallback(async (conversationId: number) => {
    try {
      const res = await api.unblockUser(conversationId);
      if (res.status === "SUCCESS") {
        toast.success("Đã bỏ chặn người dùng!");
        onConversationsChange?.(prev => prev.map(c => 
          c.id === conversationId 
            ? { ...res.data, otherUser: { ...res.data.otherUser, online: c.otherUser.online, lastActiveAt: c.otherUser.lastActiveAt } }
            : c
        ));
        setSearchResults(prev =>
          prev.map(u => u.conversationId === conversationId
            ? { ...u, canSendRequest: false, relationStatus: "ACCEPTED" as const }
            : u
          )
        );
        setViewingProfile(prev =>
          prev?.conversationId === conversationId
            ? { ...prev, canSendRequest: false, relationStatus: "ACCEPTED" as const }
            : prev
        );
        return true;
      } else {
        toast.error(res.message || "Không thể bỏ chặn người dùng");
        return false;
      }
    } catch (error) {
      console.error("Failed to unblock:", error);
      toast.error("Không thể bỏ chặn người dùng");
      return false;
    }
  }, [onConversationsChange]);

  const updateOnlineStatus = useCallback((userId: number, online: boolean, lastActiveAt?: string) => {
    const updateList = (list: ChatConversation[]) =>
      list.map(conv => {
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
      });

    setPendingRequests(updateList);
    setSentRequests(updateList);
  }, []);

  return {
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
    updateOnlineStatus,
  };
}
