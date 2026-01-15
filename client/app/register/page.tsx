import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from "@/components/auth/forms/RegisterForm";
import AuthLayout from "@/components/auth/layout/AuthLayout";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản Freelancer miễn phí để bắt đầu tìm kiếm việc làm hoặc tuyển dụng nhân tài.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div>Đang tải...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
