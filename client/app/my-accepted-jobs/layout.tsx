import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý các hợp đồng",
  description: "Xem và quản lý các hợp đồng của bạn trên Freelancer.",
};

export default function MyAcceptedJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
