"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { ChatUserSearchResult } from "@/lib/api";
import UserAvatar from "../shared/UserAvatar";
import MessagesLoading from "../shared/MessagesLoading";
import MessagesEmptyState from "../shared/MessagesEmptyState";

interface SearchResultsProps {
  results: ChatUserSearchResult[];
  loading: boolean;
  sendingRequestId: number | null;
  onSendRequest: (user: ChatUserSearchResult) => void;
  onViewProfile: (user: ChatUserSearchResult) => void;
}

export default function SearchResults({
  results,
  loading,
  sendingRequestId,
  onSendRequest,
  onViewProfile,
}: SearchResultsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="px-4 py-2 bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase">Thêm bạn mới</p>
      </div>
      
      {loading ? (
        <MessagesLoading type="search" count={3} />
      ) : results.length === 0 ? (
        <MessagesEmptyState 
          icon="person_search" 
          message="Không tìm thấy người dùng" 
        />
      ) : (
        results.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
          >
            <button onClick={() => onViewProfile(user)} className="shrink-0">
              <UserAvatar src={user.avatarUrl} name={user.fullName} size="lg" />
            </button>
            
            <button 
              onClick={() => onViewProfile(user)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="font-medium text-sm text-gray-900 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </button>
            
            <div className="shrink-0">
              {user.canSendRequest ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendRequest(user);
                  }}
                  disabled={sendingRequestId === user.id}
                  className="text-[#00b14f] border-[#00b14f] hover:bg-[#00b14f] hover:text-white disabled:opacity-50"
                >
                  <Icon name="person_add" size={16} className="mr-1" />
                  Kết bạn
                </Button>
              ) : (
                <span className={`text-xs px-2 py-1 rounded ${
                  user.relationStatus === "ACCEPTED" 
                    ? "text-green-600 bg-green-50" 
                    : user.relationStatus === "BLOCKED"
                    ? "text-red-500 bg-red-50"
                    : "text-gray-500 bg-gray-100"
                }`}>
                  {user.relationStatus === "ACCEPTED" && "Đã kết bạn"}
                  {user.relationStatus === "PENDING" && "Đã gửi yêu cầu"}
                  {user.relationStatus === "BLOCKED" && "Đã bị chặn"}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
