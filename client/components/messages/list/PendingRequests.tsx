"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "@/lib/api";
import UserAvatar from "../shared/UserAvatar";

interface PendingRequestsProps {
  requests: ChatConversation[];
  processingId: number | null;
  onAccept: (conversationId: number) => void;
  onReject: (conversationId: number) => void;
}

export default function PendingRequests({
  requests,
  processingId,
  onAccept,
  onReject,
}: PendingRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div className="border-b border-gray-200">
      <div className="px-4 py-2 bg-orange-50">
        <p className="text-xs font-medium text-orange-600 uppercase flex items-center gap-1">
          <Icon name="person_add" size={14} />
          Yêu cầu kết bạn ({requests.length})
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
            <p className="text-xs text-gray-500 truncate">{req.firstMessage || "Muốn kết bạn với bạn"}</p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={() => onAccept(req.id)}
              disabled={processingId === req.id}
              className="bg-[#00b14f] hover:bg-[#00a347] h-8 px-3 disabled:opacity-50"
            >
              <Icon name="check" size={16} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(req.id)}
              disabled={processingId === req.id}
              className="h-8 px-3 text-gray-500 hover:text-red-500 hover:border-red-300"
            >
              <Icon name="close" size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
