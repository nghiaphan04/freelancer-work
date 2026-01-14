"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Icon from "@/components/ui/Icon";

type FileUsage = 
  | "AVATAR"
  | "COVER_IMAGE"
  | "MESSAGE_IMAGE"
  | "MESSAGE_FILE"
  | "DISPUTE_EVIDENCE"
  | "WORK_SUBMISSION"
  | "APPLICATION_CV";

interface FileUploadProps {
  value?: string;
  onChange: (url: string, file?: File | null, fileId?: number) => void;
  usage: FileUsage;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
  placeholder?: string;
}

export function FileUpload({
  value,
  onChange,
  usage,
  label,
  required,
  disabled,
  accept = "application/pdf",
  maxSize = 5 * 1024 * 1024,
  placeholder = "Click để upload file PDF (tối đa 5MB)",
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = accept.split(",").map(t => t.trim());
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Định dạng file không hợp lệ");
      return;
    }
    if (selectedFile.size > maxSize) {
      const sizeLabel = maxSize >= 1024 * 1024 
        ? `${Math.round(maxSize / 1024 / 1024)}MB` 
        : `${Math.round(maxSize / 1024)}KB`;
      toast.error(`File không được vượt quá ${sizeLabel}`);
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.uploadDocument(selectedFile, usage);
        if (response.status === "SUCCESS" && response.data) {
          setFile(selectedFile);
          onChange(response.data.secureUrl, selectedFile, response.data.id);
      } else {
        toast.error(response.message || "Upload thất bại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setFile(null);
    onChange("", null, undefined);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      {file || value ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5">
          <Icon name="picture_as_pdf" size={20} className="text-red-500" />
          <span className="flex-1 text-sm text-gray-700 truncate">
            {file?.name || "File đã upload"}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full px-3 py-4 border border-dashed border-gray-300 rounded-md hover:border-[#00b14f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Đang upload...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-500">
              <Icon name="cloud_upload" size={24} />
              <span className="text-sm">{placeholder}</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
  usage: FileUsage;
  disabled?: boolean;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ImageUploadButton({
  onUpload,
  usage,
  disabled,
  maxSize = 200 * 1024,
  className,
  children,
}: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ định dạng: JPG, PNG, GIF, WebP");
      return;
    }
    if (file.size > maxSize) {
      const sizeLabel = maxSize >= 1024 * 1024 
        ? `${Math.round(maxSize / 1024 / 1024)}MB` 
        : `${Math.round(maxSize / 1024)}KB`;
      toast.error(`Ảnh không được vượt quá ${sizeLabel}`);
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.uploadImage(file, usage);
      if (response.status === "SUCCESS" && response.data) {
        onUpload(response.data.secureUrl);
      } else {
        toast.error(response.message || "Upload thất bại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={className}
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          children || <Icon name="photo_camera" size={14} className="text-gray-600" />
        )}
      </button>
    </>
  );
}
