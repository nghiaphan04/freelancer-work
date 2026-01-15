"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, ChatConversation } from "@/lib/api";

export default function UnreadMessageTitle() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const [unreadUserCount, setUnreadUserCount] = useState(0);
  const [latestSender, setLatestSender] = useState<string | null>(null);
  const [showSender, setShowSender] = useState(false);
  const baseTitleRef = useRef("Freelancer - Kiến tạo sự nghiệp của riêng bạn");

  const fetchUnreadData = useCallback(async () => {
    try {
      const res = await api.getConversations();
      if (res.status === "SUCCESS") {
        const conversations: ChatConversation[] = res.data;
        
        const unreadConvs = conversations
          .filter(conv => conv.unreadCount > 0 && conv.lastMessageSenderId !== user?.id)
          .sort((a, b) => 
            new Date(b.lastMessageTime || b.createdAt).getTime() - 
            new Date(a.lastMessageTime || a.createdAt).getTime()
          );

        setUnreadUserCount(unreadConvs.length);

        if (unreadConvs.length > 0) {
          setLatestSender(unreadConvs[0].otherUser.fullName);
        } else {
          setLatestSender(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    fetchUnreadData();
    const interval = setInterval(fetchUnreadData, 30000);

    return () => clearInterval(interval);
  }, [isHydrated, isAuthenticated, fetchUnreadData]);

  useEffect(() => {
    if (!isHydrated || unreadUserCount === 0 || !latestSender) {
      setShowSender(false);
      return;
    }

    const interval = setInterval(() => {
      setShowSender(prev => !prev);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHydrated, unreadUserCount, latestSender]);

  useEffect(() => {
    if (!isHydrated) return;

    if (unreadUserCount > 0) {
      if (showSender && latestSender) {
        document.title = `${latestSender} đã nhắn tin cho bạn`;
      } else {
        document.title = `(${unreadUserCount}) ${baseTitleRef.current}`;
      }
    } else {
      document.title = baseTitleRef.current;
    }
  }, [unreadUserCount, showSender, latestSender, isHydrated]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        fetchUnreadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated, fetchUnreadData]);

  return null;
}
