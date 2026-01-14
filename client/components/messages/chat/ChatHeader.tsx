"use client";

import Icon from "@/components/ui/Icon";
import { ChatUserInfo } from "@/lib/api";
import UserAvatar from "../shared/UserAvatar";
import { formatLastActive } from "@/lib/format";

interface ChatHeaderProps {
  user: ChatUserInfo;
  showBackButton?: boolean;
  showProfileActive?: boolean;
  onBack?: () => void;
  onToggleProfile: () => void;
}

export default function ChatHeader({
  user,
  showBackButton = false,
  showProfileActive = false,
  onBack,
  onToggleProfile,
}: ChatHeaderProps) {
  return (
    <div className="shrink-0 border-b border-gray-200 safe-area-top">
      <div className="flex items-center gap-3 px-3 md:px-4 py-3 mt-1 md:mt-1.5 md:mb-1">
        {showBackButton && (
          <button onClick={onBack} className="p-2 -ml-1 md:hidden">
            <Icon name="arrow_back" size={24} className="text-gray-700 hover:text-gray-900" />
          </button>
        )}
        
        <UserAvatar 
          src={user.avatarUrl} 
          name={user.fullName} 
          size="md" 
        />
        
        <div className="min-w-0 max-w-[120px] md:max-w-[200px]">
          <h2 className="font-semibold text-gray-900 truncate">{user.fullName}</h2>
          <p className="text-xs text-gray-500 truncate">
            {user.online ? (
              <span className="text-green-500">Đang hoạt động</span>
            ) : (
              formatLastActive(user.lastActiveAt)
            )}
          </p>
        </div>
        
        <div className="flex items-center ml-auto">
          <button className="p-2">
            <Icon name="phone" size={22} className="text-[#00b14f] hover:text-[#00a347]" />
          </button>
          <button className="p-2">
            <Icon name="videocam" size={22} className="text-[#00b14f] hover:text-[#00a347]" />
          </button>
          <button 
            className="p-2"
            onClick={onToggleProfile}
          >
            <Icon 
              name="info" 
              size={22} 
              className={`${showProfileActive ? "text-[#00a347]" : "text-[#00b14f]"} hover:text-[#00a347]`} 
            />
          </button>
        </div>
      </div>
    </div>
  );
}
