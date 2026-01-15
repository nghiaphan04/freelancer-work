import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chỉnh sửa việc làm",
  description: "Chỉnh sửa thông tin tin tuyển dụng của bạn trên Freelancer.",
};

export default function EditJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
