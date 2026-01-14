"use client";

import Icon from "@/components/ui/Icon";

export type EvidenceMeta = {
  url: string;
  fileId?: number;
  name?: string;
  size?: number;
};

export const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

interface EvidenceCardProps {
  url: string;
  name?: string;
  size?: string;
  label?: string;
  onRemove?: () => void;
}

export default function EvidenceCard({
  url,
  name,
  size,
  label,
  onRemove,
}: EvidenceCardProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors">
      <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
      <div className="flex-1 text-sm text-gray-700 truncate">
        <span className="font-medium">{name || label || "Tệp đính kèm"}</span>
        {size && <span className="block text-xs text-gray-500">{size}</span>}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="text-gray-500 hover:text-gray-700"
      >
        <Icon name="download" size={18} />
      </a>
      {onRemove && (
        <button onClick={onRemove} className="text-gray-500 hover:text-gray-700">
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}
