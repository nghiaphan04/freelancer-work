"use client";

import { forwardRef, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { ChatMessage, api, FileUploadResponse } from "@/lib/api";
import Image from "next/image";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendLike?: () => void;
  onCancelEdit?: () => void;
  onCancelReply?: () => void;
  onSendFile?: (fileId: number, fileType: "IMAGE" | "FILE", fileName: string, previewUrl?: string, fileSize?: number) => void;
  editingMessage?: ChatMessage | null;
  replyingTo?: ChatMessage | null;
  currentUserId: number;
  rateLimitError?: string | null;
  isBlocked?: boolean;
  blockedByMe?: boolean;
}

const MAX_IMAGE_SIZE = 200 * 1024;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_FILE_TYPES = ["application/pdf"];

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSend,
  onSendLike,
  onCancelEdit,
  onCancelReply,
  onSendFile,
  editingMessage,
  replyingTo,
  currentUserId,
  rateLimitError,
  isBlocked = false,
  blockedByMe = false,
}, ref) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    preview: string;
    type: "IMAGE" | "FILE";
  } | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isBlocked) return;
    if (e.key === "Enter" && !uploading) {
      if (previewFile) {
        handleUploadAndSend();
      } else {
        onSend();
      }
    }
    if (e.key === "Escape") {
      if (previewFile) {
        cancelPreview();
      } else if (editingMessage) {
        onCancelEdit?.();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        setUploadError(null);

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setUploadError("Chỉ hỗ trợ định dạng: JPG, PNG, GIF, WebP");
          return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setUploadError("Ảnh không được vượt quá 200KB");
          return;
        }

        const preview = URL.createObjectURL(file);
        const timestamp = new Date().getTime();
        const extension = file.type.split("/")[1] || "png";
        const renamedFile = new File([file], `pasted-image-${timestamp}.${extension}`, { type: file.type });
        
        setPreviewFile({ file: renamedFile, preview, type: "IMAGE" });
        return;
      }
    }
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "FILE") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (type === "IMAGE") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setUploadError("Chỉ hỗ trợ định dạng: JPG, PNG, GIF, WebP");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setUploadError("Ảnh không được vượt quá 200KB");
        return;
      }
      const preview = URL.createObjectURL(file);
      setPreviewFile({ file, preview, type: "IMAGE" });
    } else {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setUploadError("Chỉ hỗ trợ định dạng PDF");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError("File không được vượt quá 5MB");
        return;
      }
      setPreviewFile({ file, preview: "", type: "FILE" });
    }

    e.target.value = "";
  };

  const cancelPreview = () => {
    if (previewFile?.preview) {
      URL.revokeObjectURL(previewFile.preview);
    }
    setPreviewFile(null);
    setUploadError(null);
  };

  const handleUploadAndSend = async () => {
    if (!previewFile || !onSendFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const usage = previewFile.type === "IMAGE" ? "MESSAGE_IMAGE" : "MESSAGE_FILE";
      const response = previewFile.type === "IMAGE"
        ? await api.uploadImage(previewFile.file, usage)
        : await api.uploadDocument(previewFile.file, usage);

      if (response.status === "SUCCESS" && response.data) {
        const fileData = response.data;
        onSendFile(
          fileData.id,
          previewFile.type,
          fileData.originalFilename,
          fileData.secureUrl,
          fileData.sizeBytes
        );
        cancelPreview();
      } else {
        setUploadError(response.message || "Upload thất bại");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Có lỗi xảy ra khi upload");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isBlocked) {
    return (
      <div className="border-t border-gray-100 bg-white safe-area-bottom shrink-0">
        <div className="flex items-center justify-center px-4 py-4 text-gray-500">
          <Icon name="block" size={18} className="mr-2 text-gray-400" />
          <span className="text-sm">
            {blockedByMe 
              ? "Bạn đã chặn người này. Bỏ chặn để tiếp tục nhắn tin." 
              : "Bạn không thể gửi tin nhắn cho người này."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-white safe-area-bottom shrink-0">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e, "IMAGE")}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFileChange(e, "FILE")}
      />

      {rateLimitError && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-500 text-center">
            <Icon name="error" size={14} className="inline mr-1" />
            {rateLimitError}
          </p>
        </div>
      )}

      
      {editingMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-600">
              <Icon name="edit" size={14} className="inline mr-1" />
              Đang chỉnh sửa tin nhắn
            </p>
            <p className="text-sm text-gray-500 truncate">{editingMessage.content}</p>
          </div>
          <button 
            onClick={onCancelEdit} 
            className="disabled:opacity-50"
            disabled={uploading}
          >
            <Icon name="close" size={20} className="text-blue-400 hover:text-blue-600" />
          </button>
        </div>
      )}
      
      {replyingTo && !editingMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#00b14f]">
              <Icon name="reply" size={14} className="inline mr-1" />
              Đang trả lời {replyingTo.sender.id === currentUserId ? "chính bạn" : replyingTo.sender.fullName}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {replyingTo.messageType === "IMAGE" ? "Hình ảnh" : 
               replyingTo.messageType === "FILE" ? "Tệp đính kèm" : 
               replyingTo.content}
            </p>
          </div>
          <button 
            onClick={onCancelReply} 
            className="disabled:opacity-50"
            disabled={uploading}
          >
            <Icon name="close" size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {previewFile && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {previewFile.type === "IMAGE" ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                <Image
                  src={previewFile.preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <Icon name="picture_as_pdf" size={40} className="text-red-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {previewFile.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(previewFile.file.size)}
              </p>
            </div>
            <button 
              onClick={cancelPreview} 
              className="disabled:opacity-50"
              disabled={uploading}
            >
              <Icon name="close" size={20} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-2 mb-1 md:mb-1.5 mt-1">
        <button 
          className="p-1.5 shrink-0 disabled:opacity-50"
          onClick={handleFileSelect}
          disabled={uploading || !!editingMessage}
          title="Gửi tệp PDF (max 5MB)"
        >
          <Icon name="add_circle" size={22} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <button 
          className="p-1.5 shrink-0 disabled:opacity-50"
          onClick={handleImageSelect}
          disabled={uploading || !!editingMessage}
          title="Chụp ảnh"
        >
          <Icon name="camera_alt" size={20} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <button 
          className="p-1.5 shrink-0 disabled:opacity-50"
          onClick={handleImageSelect}
          disabled={uploading || !!editingMessage}
          title="Gửi ảnh (max 200KB)"
        >
          <Icon name="image" size={20} className="text-[#00b14f] hover:text-[#00a347]" />
        </button>
        <button 
          className="p-1.5 shrink-0 opacity-50 cursor-not-allowed" 
          title="Chưa hỗ trợ"
          disabled
        >
          <Icon name="mic" size={20} className="text-[#00b14f]" />
        </button>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={editingMessage ? "Nhập nội dung mới..." : previewFile ? "Thêm chú thích..." : "Aa"}
          disabled={uploading}
          className={`flex-1 rounded-full border-0 h-9 ${
            editingMessage 
              ? "bg-blue-50 focus-visible:ring-blue-500" 
              : "bg-gray-100 focus-visible:ring-[#00b14f]"
          }`}
        />
        {previewFile ? (
          <button 
            onClick={handleUploadAndSend} 
            className="p-1.5 shrink-0 disabled:opacity-50"
            disabled={uploading}
          >
            {uploading ? (
              <Icon name="sync" size={20} className="text-[#00b14f] animate-spin" />
            ) : (
              <Icon name="send" size={20} className="text-[#00b14f]" />
            )}
          </button>
        ) : value.trim() ? (
          <button 
            onClick={onSend} 
            className="p-1.5 shrink-0 disabled:opacity-50"
            disabled={uploading}
          >
            <Icon 
              name={editingMessage ? "check" : "send"} 
              size={20} 
              className={editingMessage ? "text-blue-500" : "text-[#00b14f]"} 
            />
          </button>
        ) : (
          <button 
            onClick={onSendLike} 
            className="p-1.5 shrink-0 disabled:opacity-50"
            disabled={uploading}
          >
            <Icon name="thumb_up" size={22} className="text-[#00b14f]" />
          </button>
        )}
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
