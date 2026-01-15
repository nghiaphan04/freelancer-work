import type { Metadata } from "next";
import AuthLayout from "@/components/auth/layout/AuthLayout";
import ForgotPasswordForm from "@/components/auth/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Khôi phục mật khẩu tài khoản Freelancer của bạn.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
