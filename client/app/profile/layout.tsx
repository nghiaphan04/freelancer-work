import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân",
  description: "Quản lý hồ sơ cá nhân, kỹ năng và thông tin của bạn trên Freelancer.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
