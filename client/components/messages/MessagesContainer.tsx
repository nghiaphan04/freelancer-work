"use client";

import { useState } from "react";
import ConversationList from "./ConversationList";
import ChatBox from "./ChatBox";
import { Conversation, ChatUser } from "./types";
import { DEMO_CONVERSATIONS, DEMO_MESSAGES } from "./constants";

interface MessagesContainerProps {
  onMobileChatChange?: (isInChat: boolean) => void;
}

export default function MessagesContainer({ onMobileChatChange }: MessagesContainerProps) {
  const [conversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedConversation = conversations.find(c => c.id === selectedId);
  const selectedUser: ChatUser | null = selectedConversation 
    ? selectedConversation.user 
    : null;
  const messages = selectedId ? (DEMO_MESSAGES[selectedId] || []) : [];

  const handleSelectConversation = (id: number) => {
    setSelectedId(id);
    setShowMobileChat(true);
    onMobileChatChange?.(true);
  };

  const handleBack = () => {
    setShowMobileChat(false);
    onMobileChatChange?.(false);
  };

  const handleSend = (text: string) => {
    // Demo only - in real app, send to API
    console.log("Send message:", text);
  };

  return (
    <div className={`bg-white md:h-full overflow-hidden ${showMobileChat ? "h-[100dvh] fixed inset-0 z-[9999] md:relative md:z-auto" : "h-[calc(100dvh-64px)]"}`}>
      <div className="flex h-full">
        {/* Conversations List - full screen on mobile */}
        <div className={`w-full md:w-96 lg:w-[400px] md:border-r border-gray-200 ${showMobileChat ? "hidden md:block" : "block"}`}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Chat Area - full screen on mobile when selected */}
        <div className={`w-full md:w-auto flex-1 ${!showMobileChat ? "hidden md:flex" : "flex"} md:relative bg-white`}>
          <ChatBox
            user={selectedUser}
            messages={messages}
            onBack={handleBack}
            onSend={handleSend}
            showBackButton={showMobileChat}
          />
        </div>
      </div>
    </div>
  );
}
