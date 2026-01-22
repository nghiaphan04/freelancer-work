import { useState, useCallback, useRef } from "react";
import { api, ChatMessage, ChatConversation, ChatMessageType } from "@/lib/api";
import { toast } from "sonner";

interface UseMessagesOptions {
  selectedId: number | null;
  selectedConversation: ChatConversation | null;
  user: { id: number; fullName: string; avatarUrl?: string } | null;
  connected: boolean;
  wsSendMessage: (receiverId: number, content: string, replyToId?: number, messageType?: ChatMessageType) => void;
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  resetUnreadCount: (conversationId: number) => void;
}

export function useMessages({
  selectedId,
  selectedConversation,
  user,
  connected,
  wsSendMessage,
  setConversations,
  resetUnreadCount,
}: UseMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  const isLoadingMoreRef = useRef(false);
  const pendingTempIdsRef = useRef<Set<number>>(new Set());

  const fetchMessages = useCallback(async () => {
    if (!selectedId) {
      setMessages([]);
      setPage(0);
      setHasMore(true);
      isLoadingMoreRef.current = false;
      return;
    }

    try {
      setMessagesLoading(true);
      setMessages([]);
      setPage(0);
      setHasMore(true);
      isLoadingMoreRef.current = false;

      const res = await api.getMessages(selectedId, { page: 0, size: 30 });
      if (res.status === "SUCCESS") {
        const sortedMessages = [...res.data.content].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
        setHasMore(!res.data.last);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setMessagesLoading(false);
    }

    api.markMessagesAsRead(selectedId).catch(console.error);
    resetUnreadCount(selectedId);
  }, [selectedId, resetUnreadCount]);

  const handleLoadMore = useCallback(async () => {
    if (!selectedId || !hasMore || messagesLoading || isLoadingMoreRef.current) return;

    const currentConversationId = selectedId;
    const nextPage = page + 1;

    try {
      isLoadingMoreRef.current = true;
      setMessagesLoading(true);

      const res = await api.getMessages(currentConversationId, { page: nextPage, size: 30 });
      if (currentConversationId !== selectedId) return;

      if (res.status === "SUCCESS") {
        setMessages(prev => {
          const messageMap = new Map<number, ChatMessage>();
          prev.forEach(msg => messageMap.set(msg.id, msg));
          res.data.content.forEach(msg => {
            if (!messageMap.has(msg.id)) messageMap.set(msg.id, msg);
          });
          return Array.from(messageMap.values()).sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        setHasMore(!res.data.last);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setMessagesLoading(false);
      isLoadingMoreRef.current = false;
    }
  }, [selectedId, page, hasMore, messagesLoading]);

  const handleNewMessage = useCallback((message: ChatMessage, isSelectedConversation: boolean) => {
    if (isSelectedConversation) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  }, []);

  const handleRateLimitError = useCallback((message: string) => {
    const pendingIds = pendingTempIdsRef.current;
    if (pendingIds.size > 0) {
      setMessages(prev => prev.map(m =>
        pendingIds.has(m.id) ? { ...m, status: "FAILED" as const } : m
      ));
      const idsToRemove = new Set(pendingIds);
      setTimeout(() => {
        setMessages(prev => prev.filter(m => !idsToRemove.has(m.id)));
      }, 3000);
      pendingTempIdsRef.current = new Set();
    }
    setRateLimitError(message);
    setTimeout(() => setRateLimitError(null), 5000);
  }, []);

  const handleReplyMessage = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
    setEditingMessage(null);
  }, []);

  const handleStartEdit = useCallback((msg: ChatMessage) => {
    setEditingMessage(msg);
    setReplyingTo(null);
  }, []);

  const handleEditMessage = useCallback(async (messageId: number, content: string) => {
    try {
      const res = await api.updateMessage(messageId, content);
      if (res.status === "SUCCESS") {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, isEdited: true } : m));
        toast.success("Đã chỉnh sửa tin nhắn");
      } else {
        toast.error(res.message || "Không thể chỉnh sửa tin nhắn");
      }
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Không thể chỉnh sửa tin nhắn");
    }
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    try {
      const res = await api.deleteMessage(messageId);
      if (res.status === "SUCCESS") {
        setMessages(prev => {
          const updated = prev.map(m => m.id === messageId ? { ...m, isDeleted: true } : m);
          
          if (selectedConversation) {
            const sortedMessages = [...updated].sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const lastMsg = sortedMessages[0];
            if (lastMsg && lastMsg.id === messageId) {
              setConversations(convs => convs.map(c =>
                c.id === selectedConversation.id
                  ? { ...c, lastMessageDeleted: true }
                  : c
              ));
            }
          }
          
          return updated;
        });
        toast.success("Đã xóa tin nhắn");
      } else {
        toast.error(res.message || "Không thể xóa tin nhắn");
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Không thể xóa tin nhắn");
    }
  }, [selectedConversation, setConversations]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSend = useCallback((content: string, messageType: ChatMessageType = "TEXT", fileId?: number, filePreview?: { url: string; size: number }) => {
    if (!selectedConversation || !user) return;

    setRateLimitError(null);
    const receiverId = selectedConversation.otherUser.id;
    const replyToId = replyingTo?.id;

    const displayContent = messageType === "IMAGE" ? "Hình ảnh" : 
                          messageType === "FILE" ? content : 
                          content;

    const tempMessage: ChatMessage = {
      id: Date.now(),
      conversationId: selectedConversation.id,
      sender: { id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl },
      content,
      messageType,
      status: "SENT",
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, content: replyingTo.content } : undefined,
      file: filePreview ? {
        id: fileId || 0,
        url: filePreview.url,
        secureUrl: filePreview.url,
        originalFilename: content,
        fileType: messageType === "IMAGE" ? "IMAGE" : "DOCUMENT",
        mimeType: messageType === "IMAGE" ? "image/jpeg" : "application/pdf",
        format: messageType === "IMAGE" ? "jpg" : "pdf",
        sizeBytes: filePreview.size,
        readableSize: formatFileSize(filePreview.size),
      } : undefined,
    };

    setMessages(prev => [...prev, tempMessage]);
    setReplyingTo(null);

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            lastMessage: displayContent,
            lastMessageType: messageType,
            lastMessageDeleted: false,
            lastMessageTime: new Date().toISOString(),
            lastMessageSenderId: user.id,
            lastMessageStatus: "SENT" as const,
          };
        }
        return conv;
      });
      return updated.sort((a, b) =>
        new Date(b.lastMessageTime || b.createdAt).getTime() -
        new Date(a.lastMessageTime || a.createdAt).getTime()
      );
    });

    if (fileId) {
      (async () => {
        try {
          const res = await api.sendMessage(receiverId, content, messageType, replyToId, fileId);
          if (res.status === "SUCCESS") {
            setMessages(prev => prev.map(m => m.id === tempMessage.id ? res.data : m));
          } else {
            setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, status: "FAILED" as const } : m));
            setTimeout(() => setMessages(prev => prev.filter(m => m.id !== tempMessage.id)), 3000);
            toast.error(res.message || "Không thể gửi tin nhắn");
          }
        } catch (error) {
          console.error("Failed to send file message:", error);
          setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, status: "FAILED" as const } : m));
          setTimeout(() => setMessages(prev => prev.filter(m => m.id !== tempMessage.id)), 3000);
          toast.error("Không thể gửi tin nhắn");
        }
      })();
      return;
    }

    if (connected) {
      pendingTempIdsRef.current.add(tempMessage.id);
      wsSendMessage(receiverId, content, replyToId, messageType);
      setTimeout(() => pendingTempIdsRef.current.delete(tempMessage.id), 3000);
    } else {
      (async () => {
        try {
          const res = await api.sendMessage(receiverId, content, messageType, replyToId);
          if (res.status === "SUCCESS") {
            setMessages(prev => prev.map(m => m.id === tempMessage.id ? res.data : m));
          }
        } catch (error: any) {
          console.error("Failed to send message:", error);
          setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, status: "FAILED" as const } : m));
          setTimeout(() => setMessages(prev => prev.filter(m => m.id !== tempMessage.id)), 3000);

          if (error?.response?.status === 429 || error?.message?.includes("429")) {
            setRateLimitError(error?.response?.data?.message || "Bạn đang gửi tin nhắn quá nhanh.");
            setTimeout(() => setRateLimitError(null), 5000);
          } else {
            toast.error("Không thể gửi tin nhắn");
          }
        }
      })();
    }
  }, [selectedConversation, user, replyingTo, connected, wsSendMessage, setConversations]);

  return {
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
  };
}
