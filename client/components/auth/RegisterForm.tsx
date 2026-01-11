"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/Icon";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreed: "",
  });

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreed: "",
    };
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Họ tên phải có ít nhất 2 ký tự";
      isValid = false;
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    if (!agreed) {
      newErrors.agreed = "Vui lòng đồng ý với điều khoản";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Register:", formData);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 lg:mb-3">
        <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">
          Chào mừng bạn đến với Freelancer
        </h1>
        <p className="text-gray-500 text-sm">
          Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 lg:space-y-2">
        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-sm text-gray-600">Họ và tên</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="person" size={18} className="text-[#00b14f]" />
            </div>
            <Input
              id="fullName"
              type="text"
              placeholder="Nhập họ tên"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (errors.fullName) setErrors({ ...errors, fullName: "" });
              }}
              className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.fullName ? "border-red-500" : ""}`}
            />
          </div>
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
        </div>

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
              placeholder="Nhập mật khẩu"
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

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-sm text-gray-600">Xác nhận mật khẩu</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="shield" size={18} className="text-[#00b14f]" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
              }}
              className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.confirmPassword ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Icon 
                name={showConfirmPassword ? "visibility" : "visibility_off"} 
                size={18} 
                className="text-gray-400 hover:text-gray-600" 
              />
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
        </div>

        {/* Terms Checkbox */}
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => {
                setAgreed(checked as boolean);
                if (errors.agreed) setErrors({ ...errors, agreed: "" });
              }}
              className={`mt-0.5 shrink-0 data-[state=checked]:bg-[#00b14f] data-[state=checked]:border-[#00b14f] ${errors.agreed ? "border-red-500" : ""}`}
            />
            <Label htmlFor="terms" className="text-sm font-normal text-gray-600 leading-relaxed cursor-pointer">
              Tôi đã đọc và đồng ý với{" "}
              <Link href="/terms" className="text-[#00b14f] hover:underline">
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link href="/privacy" className="text-[#00b14f] hover:underline">
                Chính sách bảo mật
              </Link>{" "}
              của Freelancer
            </Label>
          </div>
          {errors.agreed && <p className="text-red-500 text-xs">{errors.agreed}</p>}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold"
        >
          Đăng ký
        </Button>
      </form>

      {/* Login Link */}
      <p className="text-center mt-3 text-sm text-gray-600">
        Bạn đã có tài khoản?{" "}
        <Link href="/login" className="text-[#00b14f] font-medium hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
