"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { validateEmail, validatePassword, formatOtpTime, saveAuthData, AUTH_CONSTANTS, AUTH_MESSAGES } from "@/constant/auth";
import { useAuthLoading, useAuth } from "@/context/AuthContext";
import { User } from "@/types/user";

type Step = "register" | "otp";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, setIsLoading } = useAuthLoading();
  const { setUser } = useAuth();
  const initialStep = (searchParams.get("step") as Step) || "register";
  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState<Step>(initialStep);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: initialEmail, password: "", confirmPassword: "" });
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(AUTH_CONSTANTS.OTP_EXPIRES_IN);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", email: "", password: "", confirmPassword: "", agreed: "", otp: "" });

  const disabledClass = isLoading ? "pointer-events-none opacity-50" : "";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => { if (prev <= 1) { setCanResend(true); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const validateForm = () => {
    const newErrors = { fullName: "", email: "", password: "", confirmPassword: "", agreed: "", otp: "" };
    let isValid = true;

    if (!formData.fullName.trim()) { newErrors.fullName = AUTH_MESSAGES.FULLNAME_REQUIRED; isValid = false; }
    else if (formData.fullName.trim().length < AUTH_CONSTANTS.MIN_NAME_LENGTH) { newErrors.fullName = AUTH_MESSAGES.FULLNAME_MIN; isValid = false; }

    if (!formData.email) { newErrors.email = AUTH_MESSAGES.EMAIL_REQUIRED; isValid = false; }
    else if (!validateEmail(formData.email)) { newErrors.email = AUTH_MESSAGES.EMAIL_INVALID; isValid = false; }

    if (!formData.password) { newErrors.password = AUTH_MESSAGES.PASSWORD_REQUIRED; isValid = false; }
    else if (!validatePassword(formData.password)) { newErrors.password = AUTH_MESSAGES.PASSWORD_WEAK; isValid = false; }

    if (!formData.confirmPassword) { newErrors.confirmPassword = AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED; isValid = false; }
    else if (formData.confirmPassword !== formData.password) { newErrors.confirmPassword = AUTH_MESSAGES.CONFIRM_PASSWORD_MISMATCH; isValid = false; }

    if (!agreed) { newErrors.agreed = AUTH_MESSAGES.TERMS_REQUIRED; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.register({ email: formData.email, password: formData.password, fullName: formData.fullName });
      if (response.status === "SUCCESS") {
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email.");
        setStep("otp");
        setOtpTimer((response.data as { expiresIn: number }).expiresIn || AUTH_CONSTANTS.OTP_EXPIRES_IN);
        setCanResend(false);
      } else { toast.error(response.message || "Đăng ký thất bại"); }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== AUTH_CONSTANTS.OTP_LENGTH) { setErrors({ ...errors, otp: AUTH_MESSAGES.OTP_REQUIRED }); return; }

    setIsLoading(true);
    try {
      const response = await api.verifyOtp({ email: formData.email, otp: otpCode });
      if (response.status === "SUCCESS") {
        saveAuthData({ user: (response.data as { user: User }).user });
        setUser((response.data as { user: User }).user);
        toast.success("Xác thực thành công!");
        router.push("/");
      } else { setErrors({ ...errors, otp: response.message || "Mã OTP không đúng" }); }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      const response = await api.resendOtp({ email: formData.email, otpType: "REGISTRATION" });
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi lại mã OTP.");
        setOtpTimer((response.data as { expiresIn: number }).expiresIn || AUTH_CONSTANTS.OTP_EXPIRES_IN);
        setCanResend(false);
        setOtpCode("");
      } else { toast.error(response.message || "Không thể gửi lại OTP"); }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  if (step === "otp") {
    return (
      <div className="w-full">
        <div className="mb-4 text-center">
          <Icon name="mark_email_read" size={48} className="text-[#00b14f] mx-auto mb-3" />
          <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">Xác thực email</h1>
          <p className="text-gray-500 text-sm">Chúng tôi đã gửi mã OTP đến email <strong>{formData.email}</strong></p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="otp" className="text-sm text-gray-600">Mã OTP</Label>
            <Input id="otp" type="text" placeholder="Nhập mã OTP 6 số" value={otpCode} maxLength={AUTH_CONSTANTS.OTP_LENGTH}
              onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, AUTH_CONSTANTS.OTP_LENGTH)); if (errors.otp) setErrors({ ...errors, otp: "" }); }}
              disabled={isLoading} className={`h-12 text-center text-2xl tracking-widest font-mono border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.otp ? "border-red-500" : ""}`} />
            {errors.otp && <p className="text-red-500 text-xs text-center">{errors.otp}</p>}
          </div>

          <div className="text-center text-sm text-gray-500">
            {otpTimer > 0 ? <p>Mã OTP hết hạn sau <span className="text-[#00b14f] font-medium">{formatOtpTime(otpTimer)}</span></p> : <p className="text-red-500">{AUTH_MESSAGES.OTP_EXPIRED}</p>}
          </div>

          <Button type="submit" disabled={isLoading || otpCode.length !== AUTH_CONSTANTS.OTP_LENGTH} className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold">
            {isLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xác thực...</div> : "Xác thực"}
          </Button>

          <button type="button" onClick={handleResendOtp} disabled={!canResend || isLoading} className={`w-full text-sm ${canResend ? "text-[#00b14f] hover:underline" : "text-gray-400 cursor-not-allowed"}`}>
            Gửi lại mã OTP
          </button>
        </form>

        <div className="flex justify-center mt-3">
          <button type="button" onClick={() => setStep("register")} disabled={isLoading} className="text-sm text-gray-500 hover:text-[#00b14f] disabled:opacity-50 disabled:cursor-not-allowed">← Quay lại đăng ký</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 lg:mb-3">
        <h1 className="text-lg sm:text-xl font-bold text-[#00b14f] mb-1">Chào mừng bạn đến với Freelancer</h1>
        <p className="text-gray-500 text-sm">Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-2.5 lg:space-y-2">
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-sm text-gray-600">Họ và tên</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="person" size={18} className="text-[#00b14f]" /></div>
            <Input id="fullName" type="text" placeholder="Nhập họ tên" value={formData.fullName}
              onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); if (errors.fullName) setErrors({ ...errors, fullName: "" }); }}
              disabled={isLoading} className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.fullName ? "border-red-500" : ""}`} />
          </div>
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="mail" size={18} className="text-[#00b14f]" /></div>
            <Input id="email" type="email" placeholder="Nhập email" value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: "" }); }}
              disabled={isLoading} className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.email ? "border-red-500" : ""}`} />
          </div>
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm text-gray-600">Mật khẩu</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="shield" size={18} className="text-[#00b14f]" /></div>
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu" value={formData.password}
              onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: "" }); }}
              disabled={isLoading} className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.password ? "border-red-500" : ""}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading}>
              <Icon name={showPassword ? "visibility" : "visibility_off"} size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-sm text-gray-600">Xác nhận mật khẩu</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="shield" size={18} className="text-[#00b14f]" /></div>
            <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" value={formData.confirmPassword}
              onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" }); }}
              disabled={isLoading} className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.confirmPassword ? "border-red-500" : ""}`} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading}>
              <Icon name={showConfirmPassword ? "visibility" : "visibility_off"} size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => { setAgreed(c as boolean); if (errors.agreed) setErrors({ ...errors, agreed: "" }); }}
              disabled={isLoading} className={`mt-0.5 shrink-0 data-[state=checked]:bg-[#00b14f] data-[state=checked]:border-[#00b14f] ${errors.agreed ? "border-red-500" : ""}`} />
            <Label htmlFor="terms" className={`text-sm font-normal text-gray-600 leading-relaxed cursor-pointer ${disabledClass}`}>
              Tôi đã đọc và đồng ý với <Link href="/terms" className={`text-[#00b14f] hover:underline ${disabledClass}`}>Điều khoản dịch vụ</Link> và <Link href="/privacy" className={`text-[#00b14f] hover:underline ${disabledClass}`}>Chính sách bảo mật</Link>
            </Label>
          </div>
          {errors.agreed && <p className="text-red-500 text-xs">{errors.agreed}</p>}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-10 lg:h-11 bg-[#00b14f] text-sm font-semibold">
          {isLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang đăng ký...</div> : "Đăng ký"}
        </Button>
      </form>

      <p className="text-center mt-3 text-sm text-gray-600">
        Bạn đã có tài khoản? <Link href="/login" className={`text-[#00b14f] font-medium hover:underline ${disabledClass}`}>Đăng nhập ngay</Link>
      </p>
    </div>
  );
}
