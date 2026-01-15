"use client";

import { useState, useCallback } from "react";
import { ChatMessage } from "@/lib/api";

interface UseChatActionsOptions {
  onSend?: (content: string) => void;
  onEditMessage?: (messageId: number, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: number) => Promise<void>;
  onReplyMessage?: (message: ChatMessage) => void;
  onStartEdit?: (message: ChatMessage) => void;
  onCancelEdit?: () => void;
  onCancelReply?: () => void;
}

export function useChatActions({
  onSend,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onStartEdit,
  onCancelEdit,
  onCancelReply,
}: UseChatActionsOptions) {
  const [message, setMessage] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const [showMenuId, setShowMenuId] = useState<number | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<number | null>(null);
  const [expandedTimeIds, setExpandedTimeIds] = useState<Set<number>>(new Set());

  const toggleTimeDisplay = useCallback((msgId: number) => {
    setExpandedTimeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        newSet.add(msgId);
      }
      return newSet;
    });
  }, []);

  const highlightMessage = useCallback((messageId: number) => {
    setHighlightedMsgId(messageId);
    setTimeout(() => setHighlightedMsgId(null), 2000);
  }, []);

  const handleSend = useCallback(async (editingMessage?: ChatMessage | null) => {
    if (!message.trim()) return;

    if (editingMessage) {
      await onEditMessage?.(editingMessage.id, message.trim());
      onCancelEdit?.();
    } else {
      onSend?.(message);
    }
    setMessage("");
  }, [message, onSend, onEditMessage, onCancelEdit]);

  const handleDelete = useCallback(async (msgId: number) => {
    await onDeleteMessage?.(msgId);
    setShowMenuId(null);
  }, [onDeleteMessage]);

  const handleReply = useCallback((msg: ChatMessage) => {
    onReplyMessage?.(msg);
    setShowMenuId(null);
  }, [onReplyMessage]);

  const handleStartEdit = useCallback((msg: ChatMessage) => {
    onStartEdit?.(msg);
    setShowMenuId(null);
  }, [onStartEdit]);

  const handleCancelEdit = useCallback(() => {
    onCancelEdit?.();
    setMessage("");
  }, [onCancelEdit]);

  const handleMouseEnter = useCallback((msgId: number) => {
    setHoveredMsgId(msgId);
  }, []);

  const handleMouseLeave = useCallback((isMenuOpen: boolean) => {
    setHoveredMsgId(null);
    if (!isMenuOpen) setShowMenuId(null);
  }, []);

  const toggleMenu = useCallback((msgId: number) => {
    setShowMenuId(prev => prev === msgId ? null : msgId);
  }, []);

  const closeMenu = useCallback(() => {
    setShowMenuId(null);
  }, []);

  return {
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
  };
}
