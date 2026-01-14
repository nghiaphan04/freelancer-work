import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng việc mới",
  description: "Đăng tin tuyển dụng mới để tìm kiếm ứng viên phù hợp trên Freelancer.",
};

export default function CreateJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
