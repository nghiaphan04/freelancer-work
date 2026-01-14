import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Việc đã nhận",
  description: "Xem và quản lý các công việc bạn đã nhận trên Freelancer.",
};

export default function MyAcceptedJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
