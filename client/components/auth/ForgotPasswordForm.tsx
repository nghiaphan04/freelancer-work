"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/Icon";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setError("");
    setSuccess(true);
    console.log("Reset password for:", email);
  };

  if (success) {
    return (
      <div className="w-full">
        <div className="mb-4 text-center">
          <div className="w-16 h-16 bg-[#00b14f]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="mark_email_read" size={32} className="text-[#00b14f]" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">
            Kiểm tra email của bạn
          </h1>
          <p className="text-gray-500 text-sm">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email <strong>{email}</strong>
          </p>
        </div>

        <Link href="/login">
          <Button className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold">
            Quay lại đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 lg:mb-3">
        <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">
          Quên mật khẩu
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="mail" size={18} className="text-[#00b14f]" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${error ? "border-red-500" : ""}`}
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Terms Text */}
        <p className="text-sm text-gray-600">
          Bằng việc thực hiện đổi mật khẩu, bạn đã đồng ý với{" "}
          <Link href="/terms" className="text-[#00b14f] hover:underline">
            Điều khoản dịch vụ
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="text-[#00b14f] hover:underline">
            Chính sách bảo mật
          </Link>{" "}
          của chúng tôi
        </p>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold"
        >
          Tạo lại mật khẩu
        </Button>
      </form>

      {/* Links */}
      <div className="flex justify-between mt-3">
        <Link href="/login" className="text-sm text-[#00b14f] hover:underline">
          Quay lại đăng nhập
        </Link>
        <Link href="/register" className="text-sm text-[#00b14f] hover:underline">
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}
