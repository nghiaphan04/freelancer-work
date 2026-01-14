import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Việc đã đăng",
  description: "Quản lý các công việc bạn đã đăng tuyển trên Freelancer.",
};

export default function MyPostedJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
