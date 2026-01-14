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

/**
 * Format thời gian tương đối (vd: "5 phút", "2 giờ", "3 ngày")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;
  
  return date.toLocaleDateString("vi-VN", { 
    day: "2-digit", 
    month: "2-digit" 
  });
}

/**
 * Format giờ phút (HH:MM)
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

/**
 * Format thời gian hoạt động cuối
 */
export function formatLastActive(dateString?: string): string {
  if (!dateString) return "Không hoạt động";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hoạt động vừa xong";
  if (diffMins < 60) return `Hoạt động ${diffMins} phút trước`;
  if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;
  if (diffDays < 7) return `Hoạt động ${diffDays} ngày trước`;
  
  return `Hoạt động ${date.toLocaleDateString("vi-VN", { 
    day: "2-digit", 
    month: "2-digit" 
  })}`;
}

/**
 * Format ngày phân cách (Hôm nay, Hôm qua, Thứ X, hoặc ngày đầy đủ)
 */
export function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / 86400000);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  
  if (diffDays < 7) {
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return dayNames[date.getDay()];
  }
  
  return date.toLocaleDateString("vi-VN", { 
    weekday: "long",
    day: "2-digit", 
    month: "2-digit",
    year: "numeric"
  });
}

/**
 * Kiểm tra 2 ngày có cùng ngày không
 */
export function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() 
    && d1.getMonth() === d2.getMonth() 
    && d1.getDate() === d2.getDate();
}

/**
 * Lấy icon trạng thái tin nhắn
 */
export function getMessageStatusIcon(status: string): string {
  switch (status) {
    case "SENT": return "check";
    case "DELIVERED": return "done_all";
    case "READ": return "done_all";
    default: return "check";
  }
}

/**
 * Lấy màu trạng thái tin nhắn
 */
export function getMessageStatusColor(status: string): string {
  switch (status) {
    case "READ": return "text-blue-500";
    default: return "text-gray-400";
  }
}

/**
 * Lấy text hiển thị reply
 */
export function getReplyLabel(
  isMe: boolean, 
  replySenderId: number, 
  currentUserId: number, 
  messageSenderId: number,
  replySenderName: string,
  messageSenderName: string
): string {
  if (isMe) {
    return replySenderId === currentUserId 
      ? "Bạn đã trả lời chính mình" 
      : `Bạn đã trả lời ${replySenderName}`;
  }
  
  if (replySenderId === currentUserId) {
    return `${messageSenderName} đã trả lời bạn`;
  }
  
  if (replySenderId === messageSenderId) {
    return `${messageSenderName} đã trả lời chính họ`;
  }
  
  return `${messageSenderName} đã trả lời ${replySenderName}`;
}
