import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Việc làm",
  description: "Khám phá hàng nghìn cơ hội việc làm hấp dẫn trên Freelancer. Tìm công việc phù hợp với kỹ năng của bạn.",
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
