"use client";

import { useMemo } from "react";
import { ChatMessage } from "@/lib/api";
import { isSameDay } from "@/lib/format";

export interface MessageGroupInfo {
  isMe: boolean;
  showDateSeparator: boolean;
  isGroupedWithPrev: boolean;
  isLastInGroup: boolean;
  isLastMessage: boolean;
}

export function useMessageGroups(messages: ChatMessage[], currentUserId: number) {
  return useMemo(() => {
    const groupInfoMap = new Map<number, MessageGroupInfo>();

    messages.forEach((msg, index) => {
      const isMe = msg.sender.id === currentUserId;
      const prevMsg = index > 0 ? messages[index - 1] : null;
      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

      const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

      const msgTime = new Date(msg.createdAt).getTime();
      const now = Date.now();
      const isWithin24h = (now - msgTime) < 24 * 60 * 60 * 1000;
      const prevMsgTime = prevMsg ? new Date(prevMsg.createdAt).getTime() : 0;
      const isSameSenderAsPrev = prevMsg !== null && prevMsg.sender.id === msg.sender.id;
      const isWithin10MinOfPrev = prevMsg !== null && (msgTime - prevMsgTime) < 10 * 60 * 1000;
      const isGroupedWithPrev = isWithin24h && isSameSenderAsPrev && isWithin10MinOfPrev && !showDateSeparator;

      const nextMsgTime = nextMsg ? new Date(nextMsg.createdAt).getTime() : 0;
      const isSameSenderAsNext = nextMsg !== null && nextMsg.sender.id === msg.sender.id;
      const isWithin10MinOfNext = nextMsg !== null && (nextMsgTime - msgTime) < 10 * 60 * 1000;
      const nextHasDifferentDate = nextMsg !== null && !isSameDay(msg.createdAt, nextMsg.createdAt);
      const isLastInGroup = !nextMsg || !isSameSenderAsNext || !isWithin10MinOfNext || !!nextHasDifferentDate;

      const isLastMessage = index === messages.length - 1;

      groupInfoMap.set(msg.id, {
        isMe,
        showDateSeparator,
        isGroupedWithPrev,
        isLastInGroup,
        isLastMessage,
      });
    });

    return groupInfoMap;
  }, [messages, currentUserId]);
}

export function getMessageGroupInfo(
  groupInfoMap: Map<number, MessageGroupInfo>,
  messageId: number
): MessageGroupInfo {
  return groupInfoMap.get(messageId) || {
    isMe: false,
    showDateSeparator: false,
    isGroupedWithPrev: false,
    isLastInGroup: true,
    isLastMessage: false,
  };
}
