import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Cập nhật tin tức, bài viết hữu ích về việc làm, kỹ năng và xu hướng nghề nghiệp.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
