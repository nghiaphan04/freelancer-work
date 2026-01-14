"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/constant/auth";
import { ChatMessage, ChatConversation } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL = `${API_URL}/ws`;

interface UseChatSocketOptions {
  onNewMessage?: (message: ChatMessage) => void;
  onMessageUpdated?: (message: ChatMessage) => void;
  onMessageDeleted?: (message: ChatMessage) => void;
  onConversationUpdated?: (conversation: ChatConversation) => void;
  onChatRequest?: (conversation: ChatConversation) => void;
  onRequestAccepted?: (conversation: ChatConversation) => void;
  onOnlineStatus?: (data: { userId: number; online: boolean }) => void;
  onMessageStatus?: (data: { messageId?: number; conversationId: number; status: string; readBy?: number }) => void;
  onRateLimitError?: (data: { type: string; message: string }) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const { isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onConversationUpdated,
    onChatRequest,
    onRequestAccepted,
    onOnlineStatus,
    onMessageStatus,
    onRateLimitError,
  } = options;

  // Send message via WebSocket
  const sendMessage = useCallback((receiverId: number, content: string, replyToId?: number, messageType: string = "TEXT") => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ receiverId, content, messageType, replyToId }),
      });
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.warn("No access token available for WebSocket");
      return;
    }
    
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[STOMP]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
      setError(null);
      console.log("WebSocket connected");

      // Subscribe to user-specific queues
      // Spring's convertAndSendToUser automatically routes to the authenticated user
      // so we subscribe to /user/queue/xxx (without email in path)

      // New messages
      client.subscribe("/user/queue/messages", (message: IMessage) => {
        const data = JSON.parse(message.body) as ChatMessage;
        onNewMessage?.(data);
      });

      // Message updated
      client.subscribe("/user/queue/message-updated", (message: IMessage) => {
        const data = JSON.parse(message.body) as ChatMessage;
        onMessageUpdated?.(data);
      });

      // Message deleted
      client.subscribe("/user/queue/message-deleted", (message: IMessage) => {
        const data = JSON.parse(message.body) as ChatMessage;
        onMessageDeleted?.(data);
      });

      // Conversation updates
      client.subscribe("/user/queue/conversations", (message: IMessage) => {
        const data = JSON.parse(message.body) as ChatConversation;
        onConversationUpdated?.(data);
      });

      // New chat requests
      client.subscribe("/user/queue/chat-requests", (message: IMessage) => {
        const data = JSON.parse(message.body) as ChatConversation;
        onChatRequest?.(data);
      });

      // Request accepted
      client.subscribe("/user/queue/request-accepted", (message: IMessage) => {
        const data = JSON.parse(message.body) as ChatConversation;
        onRequestAccepted?.(data);
      });

      // Online status
      client.subscribe("/user/queue/online-status", (message: IMessage) => {
        const data = JSON.parse(message.body);
        onOnlineStatus?.(data);
      });

      // Message status (sent/delivered/read)
      client.subscribe("/user/queue/message-status", (message: IMessage) => {
        const data = JSON.parse(message.body);
        onMessageStatus?.(data);
      });

      // Rate limit and other errors
      client.subscribe("/user/queue/errors", (message: IMessage) => {
        const data = JSON.parse(message.body);
        if (data.type === "RATE_LIMIT") {
          onRateLimitError?.(data);
        }
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
      console.log("WebSocket disconnected");
    };

    client.onStompError = (frame) => {
      setError(frame.headers.message || "WebSocket error");
      console.error("STOMP error:", frame);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onConversationUpdated,
    onChatRequest,
    onRequestAccepted,
    onOnlineStatus,
    onMessageStatus,
    onRateLimitError,
  ]);

  return {
    connected,
    error,
    sendMessage,
  };
}
