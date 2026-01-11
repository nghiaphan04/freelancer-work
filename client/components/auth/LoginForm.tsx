"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/Icon";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Login:", formData);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 lg:mb-3">
        <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">
          Chào mừng bạn đã quay trở lại
        </h1>
        <p className="text-gray-500 text-sm">
          Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng
        </p>
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
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.email ? "border-red-500" : ""}`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm text-gray-600">Mật khẩu</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="shield" size={18} className="text-[#00b14f]" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.password ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Icon 
                name={showPassword ? "visibility" : "visibility_off"} 
                size={18} 
                className="text-gray-400 hover:text-gray-600" 
              />
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-[#00b14f] hover:underline">
            Quên mật khẩu
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold"
        >
          Đăng nhập
        </Button>
      </form>

      {/* Register Link */}
      <p className="text-center mt-3 text-sm text-gray-600">
        Bạn chưa có tài khoản?{" "}
        <Link href="/register" className="text-[#00b14f] font-medium hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
