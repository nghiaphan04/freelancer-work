export interface ChatUser {
  id: number;
  name: string;
  avatar?: string;
  online: boolean;
}

export interface Conversation {
  id: number;
  user: ChatUser;
  lastMessage: string;
  time: string;
  unread: number;
}

export interface Message {
  id: number;
  sender: "me" | "other";
  text: string;
  time: string;
}

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface ChatBoxProps {
  user: ChatUser | null;
  messages: Message[];
  onBack?: () => void;
  onSend?: (message: string) => void;
  showBackButton?: boolean;
}
