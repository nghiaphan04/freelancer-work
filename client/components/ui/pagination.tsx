"use client";

import Icon from "./Icon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];

  // Luôn hiển thị trang đầu
  pages.push(0);

  if (currentPage > 2) {
    pages.push("...");
  }

  // Các trang xung quanh trang hiện tại
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (currentPage < totalPages - 3) {
    pages.push("...");
  }

  // Luôn hiển thị trang cuối
  if (totalPages > 1) {
    pages.push(totalPages - 1);
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-3 px-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 0}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        <Icon name="chevron_left" size={18} className="text-gray-600" />
      </button>

      <div className="flex items-center gap-0.5 sm:gap-1 overflow-hidden">
        {pages.map((p, idx) =>
          typeof p === "string" ? (
            <span key={idx} className="px-0.5 sm:px-1 text-gray-400 text-xs sm:text-sm">...</span>
          ) : (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              disabled={disabled}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                p === currentPage
                  ? "bg-[#00b14f] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p + 1}
            </button>
          )
        )}
      </div>

      <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">/ {totalPages}</span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages - 1}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        <Icon name="chevron_right" size={18} className="text-gray-600" />
      </button>
    </div>
  );
}
