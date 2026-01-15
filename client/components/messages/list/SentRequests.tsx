"use client";

import Icon from "@/components/ui/Icon";
import { ChatConversation } from "@/lib/api";
import UserAvatar from "../shared/UserAvatar";

interface SentRequestsProps {
  requests: ChatConversation[];
}

export default function SentRequests({ requests }: SentRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div className="border-b border-gray-200">
      <div className="px-4 py-2 bg-blue-50">
        <p className="text-xs font-medium text-blue-600 uppercase flex items-center gap-1">
          <Icon name="schedule" size={14} />
          Đang chờ phản hồi ({requests.length})
        </p>
      </div>
      
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
        >
          <UserAvatar 
            src={req.otherUser.avatarUrl} 
            name={req.otherUser.fullName} 
            size="lg" 
          />
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{req.otherUser.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{req.firstMessage || "Đã gửi yêu cầu kết bạn"}</p>
          </div>
          
          <span className="text-xs text-blue-500 shrink-0 flex items-center gap-1">
            <Icon name="hourglass_empty" size={14} />
            Đang chờ
          </span>
        </div>
      ))}
    </div>
  );
}
