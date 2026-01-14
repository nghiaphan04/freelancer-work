"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { validateEmail, saveAuthData, AUTH_MESSAGES } from "@/constant/auth";
import { useAuthLoading, useAuth } from "@/context/AuthContext";
import { User } from "@/types/user";
import AuthFormHeader from "../shared/AuthFormHeader";
import AuthFormError from "../shared/AuthFormError";
import AuthSubmitButton from "../shared/AuthSubmitButton";

export default function LoginForm() {
  const router = useRouter();
  const { isLoading, setIsLoading } = useAuthLoading();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email) { newErrors.email = AUTH_MESSAGES.EMAIL_REQUIRED; isValid = false; }
    else if (!validateEmail(formData.email)) { newErrors.email = AUTH_MESSAGES.EMAIL_INVALID; isValid = false; }

    if (!formData.password) { newErrors.password = AUTH_MESSAGES.PASSWORD_REQUIRED; isValid = false; }
    else if (formData.password.length < 6) { newErrors.password = AUTH_MESSAGES.PASSWORD_MIN; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.login(formData);
      if (response.status === "SUCCESS") {
        const responseData = response.data as { user: User; accessToken?: string };
        saveAuthData({ user: responseData.user, accessToken: responseData.accessToken });
        setUser(responseData.user);
        toast.success("Đăng nhập thành công!");
        
        if (responseData.user.roles?.includes("ROLE_ADMIN")) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        if (response.message?.includes("chưa xác thực")) {
          toast.error("Email chưa được xác thực");
          router.push(`/register?step=otp&email=${encodeURIComponent(formData.email)}`);
        } else {
          toast.error(response.message || "Đăng nhập thất bại");
        }
      }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="w-full">
      <AuthFormHeader 
        title="Chào mừng bạn đã quay trở lại" 
        subtitle="Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng" 
      />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="mail" size={18} className="text-[#00b14f]" /></div>
            <Input id="email" type="email" placeholder="Email" value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: "" }); }}
              disabled={isLoading} className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.email ? "border-red-500" : ""}`} />
          </div>
          <AuthFormError error={errors.email} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm text-gray-600">Mật khẩu</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="shield" size={18} className="text-[#00b14f]" /></div>
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={formData.password}
              onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: "" }); }}
              disabled={isLoading} className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.password ? "border-red-500" : ""}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading}>
              <Icon name={showPassword ? "visibility" : "visibility_off"} size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <AuthFormError error={errors.password} />
        </div>

        <div className="text-right">
          <Link href="/forgot-password" className={`text-sm text-[#00b14f] hover:underline ${isLoading ? "pointer-events-none opacity-50" : ""}`}>Quên mật khẩu</Link>
        </div>

        <AuthSubmitButton isLoading={isLoading} loadingText="Đang đăng nhập..." text="Đăng nhập" />
      </form>

      <p className="text-center mt-3 text-sm text-gray-600">
        Bạn chưa có tài khoản? <Link href="/register" className={`text-[#00b14f] font-medium hover:underline ${isLoading ? "pointer-events-none opacity-50" : ""}`}>Đăng ký ngay</Link>
      </p>
    </div>
  );
}
