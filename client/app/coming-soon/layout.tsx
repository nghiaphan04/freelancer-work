import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sắp ra mắt",
  description: "Tính năng mới sắp được ra mắt trên Freelancer.",
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
