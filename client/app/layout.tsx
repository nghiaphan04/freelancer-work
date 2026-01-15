import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import FloatingSupport from "@/components/layout/FloatingSupport";
import UnreadMessageTitle from "@/components/layout/UnreadMessageTitle";
import "./globals.css";

const lexend = Lexend({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"], 
  variable: "--font-lexend", 
  display: "swap", 
});

export const metadata: Metadata = {
  title: {
    default: "Freelancer - Kiến tạo sự nghiệp của riêng bạn",
    template: "%s | Freelancer",
  },
  description: "Nền tảng kết nối Freelancer và Nhà tuyển dụng. Tìm việc, đăng tin tuyển dụng, quản lý dự án - tất cả trong một.",
  icons: {
    icon: "/logo.svg",
  },
  keywords: ["việc làm", "freelancer", "tuyển dụng", "remote work", "job", "ứng tuyển"],
  authors: [{ name: "Freelancer Team" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Freelancer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${lexend.variable} ${lexend.className} antialiased overflow-x-hidden w-full`}
      >
        <AuthProvider>
          <UnreadMessageTitle />
          {children}
          <FloatingSupport />
        </AuthProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
