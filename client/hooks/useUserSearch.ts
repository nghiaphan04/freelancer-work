import { useState, useEffect, useRef, useCallback } from "react";
import { api, ChatUserSearchResult, ChatConversation } from "@/lib/api";

interface UseUserSearchOptions {
  sentRequests: ChatConversation[];
  pendingRequests: ChatConversation[];
  conversations: ChatConversation[];
  setSearchResults: React.Dispatch<React.SetStateAction<ChatUserSearchResult[]>>;
}

export function useUserSearch({
  sentRequests,
  pendingRequests,
  conversations,
  setSearchResults,
}: UseUserSearchOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (searchQuery.length < 3) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.chatSearchUsers(searchQuery);
        if (res.status === "SUCCESS") {
          const updatedResults = res.data.map(u => ({
            ...u,
            canSendRequest: u.canSendRequest &&
              !sentRequests.some(req => req.otherUser.id === u.id) &&
              !pendingRequests.some(req => req.otherUser.id === u.id) &&
              !conversations.some(conv => conv.otherUser.id === u.id),
          }));
          setSearchResults(updatedResults);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setSearchingUsers(false);
      }
    }, 500);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, sentRequests, pendingRequests, conversations, setSearchResults]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchingUsers,
    clearSearch,
  };
}
