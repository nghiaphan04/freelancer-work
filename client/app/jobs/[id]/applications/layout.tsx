import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Danh sách ứng viên",
  description: "Xem và quản lý các ứng viên đã ứng tuyển vào công việc của bạn.",
};

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
