import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Xử lý thanh toán trên Freelancer.",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
