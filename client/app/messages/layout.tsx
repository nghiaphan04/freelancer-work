import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tin nhắn",
  description: "Nhắn tin và kết nối với nhà tuyển dụng, freelancer trên nền tảng Freelancer.",
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
