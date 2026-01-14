import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ví của tôi",
  description: "Quản lý số dư, nạp tiền và xem lịch sử giao dịch trên Freelancer.",
};

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
