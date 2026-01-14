"use client";

import Icon from "@/components/ui/Icon";
import { ChatMessage } from "@/lib/api";

interface MessageActionsProps {
  message: ChatMessage;
  isMe: boolean;
  isVisible: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MessageActions({
  isMe,
  isVisible,
  isMenuOpen,
  onToggleMenu,
  onReply,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  if (isMe) {
    return (
      <div className={`flex items-center shrink-0 transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
            className="p-1 hover:text-gray-700"
            title="Tùy chọn"
          >
            <Icon name="more_vert" size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onEdit}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-500"
              >
                Thu hồi
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onReply}
          className="p-1 hover:text-gray-700"
          title="Trả lời"
        >
          <Icon name="reply" size={20} className="text-gray-400 hover:text-gray-600 scale-x-[-1]" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center shrink-0 transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <button
        onClick={onReply}
        className="p-1 hover:text-gray-700"
        title="Trả lời"
      >
        <Icon name="reply" size={20} className="text-gray-400 hover:text-gray-600" />
      </button>
    </div>
  );
}
