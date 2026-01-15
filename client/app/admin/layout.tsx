import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản trị",
  description: "Trang quản trị hệ thống Freelancer.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
