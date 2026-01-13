"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

const HIDDEN_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/admin",
  "/messages"
];

type ChatType = "feedback" | "support" | null;

const CHAT_CONFIG = {
  feedback: {
    title: "Góp ý",
    icon: "chat",
    placeholder: "Nhập góp ý của bạn...",
    description: "Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn!",
    submitText: "Gửi góp ý",
    successMessage: "Cảm ơn bạn đã góp ý!",
  },
  support: {
    title: "Hỗ trợ",
    icon: "headset_mic",
    placeholder: "Mô tả vấn đề bạn cần hỗ trợ...",
    description: "Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất!",
    submitText: "Gửi yêu cầu",
    successMessage: "Yêu cầu hỗ trợ đã được gửi!",
  },
};

export default function FloatingSupport() {
  const pathname = usePathname();
  const [openChat, setOpenChat] = useState<ChatType>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shouldHide = HIDDEN_PATHS.some(path => pathname?.startsWith(path));
  
  if (shouldHide) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(CHAT_CONFIG[openChat!].successMessage);
    setMessage("");
    setEmail("");
    setOpenChat(null);
    setIsSubmitting(false);
  };

  const config = openChat ? CHAT_CONFIG[openChat] : null;

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-center gap-3">
        <button
          onClick={() => setOpenChat("feedback")}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-[#00b14f] flex items-center justify-center shadow-md">
            <Icon name="chat" size={22} className="text-white" />
          </div>
          <span className="text-xs font-medium text-gray-600">Góp ý</span>
        </button>

        <button
          onClick={() => setOpenChat("support")}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-[#00b14f] flex items-center justify-center shadow-md">
            <Icon name="headset_mic" size={22} className="text-white" />
          </div>
          <span className="text-xs font-medium text-gray-600">Hỗ trợ</span>
        </button>
      </div>

      {/* Chat Popup */}
      {openChat && config && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-50 md:bg-transparent"
            onClick={() => !isSubmitting && setOpenChat(null)}
          />
          
          {/* Chat Box - positioned to the left of clicked button */}
          <div 
            className={`fixed right-0 z-50 w-full md:w-96 bg-white md:rounded-2xl shadow-2xl overflow-hidden md:right-20 ${
              openChat === "feedback" 
                ? "bottom-0 md:bottom-[100px]" 
                : "bottom-0 md:bottom-6"
            }`}
          >
            {/* Header */}
            <div className="bg-[#00b14f] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={config.icon} size={22} className="text-white" />
                <span className="font-semibold text-white">{config.title}</span>
              </div>
              <button
                onClick={() => !isSubmitting && setOpenChat(null)}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white disabled:opacity-50"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Icon name="info" size={18} className="text-[#00b14f] mt-0.5" />
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>

              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b14f] focus:border-transparent disabled:bg-gray-100 text-sm"
                />
              </div>

              {/* Message input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={config.placeholder}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b14f] focus:border-transparent disabled:bg-gray-100 text-sm resize-none"
                />
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className="w-full bg-[#00b14f] hover:bg-[#00a047] text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Icon name="send" size={18} className="mr-2" />
                    {config.submitText}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
