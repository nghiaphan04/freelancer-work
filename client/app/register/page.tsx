import { Suspense } from "react";
import RegisterForm from "@/components/auth/forms/RegisterForm";
import AuthLayout from "@/components/auth/layout/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div>Đang tải...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
