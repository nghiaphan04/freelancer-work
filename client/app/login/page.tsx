import type { Metadata } from "next";
import LoginForm from "@/components/auth/forms/LoginForm";
import AuthLayout from "@/components/auth/layout/AuthLayout";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản Freelancer để tìm kiếm việc làm, kết nối với nhà tuyển dụng và quản lý hồ sơ của bạn.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
