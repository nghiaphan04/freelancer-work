// Payment status matching backend
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";

// Payment response from backend
export interface Payment {
  id: number;
  appTransId: string;
  zpTransId?: number;
  jobId: number;
  jobTitle: string;
  employerId?: number;
  employerName?: string;
  escrowAmount: number;
  feeAmount: number;
  feePercent: number;
  totalAmount: number;
  currency: string;
  description?: string;
  orderUrl?: string;
  qrCode?: string;
  status: PaymentStatus;
  paymentChannel?: number;
  expiredAt?: string;
  paidAt?: string;
  createdAt: string;
  refundAmount?: number;
  refundedAt?: string;
  refundReason?: string;
}

// Payment statistics for admin
export interface PaymentStatistics {
  totalRevenue: number;
  totalEscrowAmount: number;
  totalFeeAmount: number;
  totalTransactions: number;
  paidTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  expiredTransactions: number;
  todayRevenue: number;
  todayTransactions: number;
  monthRevenue: number;
  monthTransactions: number;
}

// UI Config
export const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
  EXPIRED: { label: "Hết hạn", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Đã hoàn tiền", color: "bg-blue-100 text-blue-700" },
} as const;
