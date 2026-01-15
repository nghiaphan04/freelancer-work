"use client";

import { ChatMessage, ChatUserInfo } from "@/lib/api";
import { useMessageGroups, getMessageGroupInfo } from "@/hooks/useMessageGroups";
import MessagesLoading from "../shared/MessagesLoading";
import UserAvatar from "../shared/UserAvatar";
import DateSeparator from "../shared/DateSeparator";
import MessageBubble from "../bubble/MessageBubble";
import MessageActions from "../bubble/MessageActions";
import DeletedMessage from "../bubble/DeletedMessage";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: number;
  otherUser: ChatUserInfo;
  loading: boolean;
  hoveredMsgId: number | null;
  showMenuId: number | null;
  highlightedMsgId: number | null;
  expandedTimeIds: Set<number>;
  onMouseEnter: (msgId: number) => void;
  onMouseLeave: (isMenuOpen: boolean) => void;
  onToggleMenu: (msgId: number) => void;
  onToggleTime: (msgId: number) => void;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msgId: number) => void;
  onScrollToMessage: (messageId: number) => void;
  messageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  endRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageList({
  messages,
  currentUserId,
  otherUser,
  loading,
  hoveredMsgId,
  showMenuId,
  highlightedMsgId,
  expandedTimeIds,
  onMouseEnter,
  onMouseLeave,
  onToggleMenu,
  onToggleTime,
  onReply,
  onEdit,
  onDelete,
  onScrollToMessage,
  messageRefs,
  endRef,
}: MessageListProps) {
  const groupInfoMap = useMessageGroups(messages, currentUserId);

  if (loading && messages.length === 0) {
    return <MessagesLoading type="messages" count={5} />;
  }

  return (
    <>
      {loading && messages.length > 0 && (
        <div className="py-2">
          <MessagesLoading type="messages" count={3} />
        </div>
      )}

      <div>
        {messages.map((msg) => {
          const groupInfo = getMessageGroupInfo(groupInfoMap, msg.id);
          const { isMe, showDateSeparator, isGroupedWithPrev, isLastInGroup, isLastMessage } = groupInfo;
          const isHovered = hoveredMsgId === msg.id;
          const isMenuOpen = showMenuId === msg.id;
          const showTimeAndTick = isLastMessage || expandedTimeIds.has(msg.id);

          if (msg.isDeleted) {
            return (
              <div key={msg.id}>
                {showDateSeparator && <DateSeparator date={msg.createdAt} />}
                <DeletedMessage isMe={isMe} />
              </div>
            );
          }

          return (
            <div key={msg.id} className={isGroupedWithPrev ? "mt-0.5" : "mt-3 first:mt-0"}>
              {showDateSeparator && <DateSeparator date={msg.createdAt} />}
              <div
                ref={(el) => {
                  if (el) messageRefs.current.set(msg.id, el);
                }}
                className={`flex items-end gap-2 w-full max-w-full ${isMe ? "justify-end" : "justify-start"} ${
                  highlightedMsgId === msg.id ? "animate-highlight" : ""
                }`}
                onMouseEnter={() => onMouseEnter(msg.id)}
                onMouseLeave={() => onMouseLeave(isMenuOpen)}
              >
                {!isMe && (
                  <div className="shrink-0 self-end mb-1 w-8">
                    {isLastInGroup && (
                      <UserAvatar src={otherUser.avatarUrl} name={otherUser.fullName} size="sm" />
                    )}
                  </div>
                )}

                {isMe && (
                  <MessageActions
                    message={msg}
                    isMe={true}
                    isVisible={isHovered}
                    isMenuOpen={isMenuOpen}
                    onToggleMenu={() => onToggleMenu(msg.id)}
                    onReply={() => onReply(msg)}
                    onEdit={() => onEdit(msg)}
                    onDelete={() => onDelete(msg.id)}
                  />
                )}

                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  currentUserId={currentUserId}
                  showTimeAndTick={showTimeAndTick}
                  isLastMessage={isLastMessage}
                  onToggleTime={() => onToggleTime(msg.id)}
                  onScrollToMessage={onScrollToMessage}
                />

                {!isMe && (
                  <MessageActions
                    message={msg}
                    isMe={false}
                    isVisible={isHovered}
                    isMenuOpen={false}
                    onToggleMenu={() => {}}
                    onReply={() => onReply(msg)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </>
  );
}
