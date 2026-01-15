"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { validateEmail, validatePassword, formatOtpTime, saveAuthData, AUTH_CONSTANTS, AUTH_MESSAGES } from "@/constant/auth";
import { useAuthLoading, useAuth } from "@/context/AuthContext";
import { User } from "@/types/user";
import AuthFormHeader from "../shared/AuthFormHeader";
import AuthFormError from "../shared/AuthFormError";
import AuthSubmitButton from "../shared/AuthSubmitButton";
import AuthBackButton from "../shared/AuthBackButton";

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
        const responseData = response.data as { user: User; accessToken?: string };
        saveAuthData({ user: responseData.user, accessToken: responseData.accessToken });
        setUser(responseData.user);
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
        <AuthFormHeader 
          icon="mark_email_read"
          title="Xác thực email" 
          subtitle={`Chúng tôi đã gửi mã OTP đến email ${formData.email}`}
          centered 
        />

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="otp" className="text-sm text-gray-600">Mã OTP</Label>
            <Input id="otp" type="text" placeholder="Nhập mã OTP 6 số" value={otpCode} maxLength={AUTH_CONSTANTS.OTP_LENGTH}
              onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, AUTH_CONSTANTS.OTP_LENGTH)); if (errors.otp) setErrors({ ...errors, otp: "" }); }}
              disabled={isLoading} className={`h-12 text-center text-2xl tracking-widest font-mono border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.otp ? "border-red-500" : ""}`} />
            <AuthFormError error={errors.otp} centered />
          </div>

          <div className="text-center text-sm text-gray-500">
            {otpTimer > 0 ? <p>Mã OTP hết hạn sau <span className="text-[#00b14f] font-medium">{formatOtpTime(otpTimer)}</span></p> : <p className="text-red-500">{AUTH_MESSAGES.OTP_EXPIRED}</p>}
          </div>

          <AuthSubmitButton 
            isLoading={isLoading} 
            loadingText="Đang xác thực..." 
            text="Xác thực" 
            disabled={otpCode.length !== AUTH_CONSTANTS.OTP_LENGTH}
          />

          <button type="button" onClick={handleResendOtp} disabled={!canResend || isLoading} className={`w-full text-sm ${canResend ? "text-[#00b14f] hover:underline" : "text-gray-400 cursor-not-allowed"}`}>
            Gửi lại mã OTP
          </button>
        </form>

        <AuthBackButton onClick={() => setStep("register")} text="Quay lại đăng ký" disabled={isLoading} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <AuthFormHeader 
        title="Chào mừng bạn đến với Freelancer" 
        subtitle="Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng" 
      />

      <form onSubmit={handleRegister} className="space-y-2.5 lg:space-y-2">
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-sm text-gray-600">Họ và tên</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="person" size={18} className="text-[#00b14f]" /></div>
            <Input id="fullName" type="text" placeholder="Nhập họ tên" value={formData.fullName}
              onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); if (errors.fullName) setErrors({ ...errors, fullName: "" }); }}
              disabled={isLoading} className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.fullName ? "border-red-500" : ""}`} />
          </div>
          <AuthFormError error={errors.fullName} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="mail" size={18} className="text-[#00b14f]" /></div>
            <Input id="email" type="email" placeholder="Nhập email" value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: "" }); }}
              disabled={isLoading} className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.email ? "border-red-500" : ""}`} />
          </div>
          <AuthFormError error={errors.email} />
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
          <AuthFormError error={errors.password} />
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
          <AuthFormError error={errors.confirmPassword} />
        </div>

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => { setAgreed(c as boolean); if (errors.agreed) setErrors({ ...errors, agreed: "" }); }}
              disabled={isLoading} className={`mt-0.5 shrink-0 data-[state=checked]:bg-[#00b14f] data-[state=checked]:border-[#00b14f] ${errors.agreed ? "border-red-500" : ""}`} />
            <Label htmlFor="terms" className={`text-sm font-normal text-gray-600 leading-relaxed cursor-pointer ${disabledClass}`}>
              Tôi đã đọc và đồng ý với <Link href="/terms" className={`text-[#00b14f] hover:underline ${disabledClass}`}>Điều khoản dịch vụ</Link> và <Link href="/privacy" className={`text-[#00b14f] hover:underline ${disabledClass}`}>Chính sách bảo mật</Link>
            </Label>
          </div>
          <AuthFormError error={errors.agreed} />
        </div>

        <AuthSubmitButton isLoading={isLoading} loadingText="Đang đăng ký..." text="Đăng ký" />
      </form>

      <p className="text-center mt-3 text-sm text-gray-600">
        Bạn đã có tài khoản? <Link href="/login" className={`text-[#00b14f] font-medium hover:underline ${disabledClass}`}>Đăng nhập ngay</Link>
      </p>
    </div>
  );
}
