/**
 * Format số tiền theo định dạng VND
 */
export function formatCurrency(amount?: number | null): string {
  if (!amount) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ngày giờ đầy đủ
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format ngày (không có giờ)
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
