"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { validateEmail, validatePassword, formatOtpTime, AUTH_CONSTANTS, AUTH_MESSAGES } from "@/constant/auth";
import { useAuthLoading } from "@/context/AuthContext";
import AuthFormHeader from "../shared/AuthFormHeader";
import AuthFormError from "../shared/AuthFormError";
import AuthSubmitButton from "../shared/AuthSubmitButton";
import AuthBackButton from "../shared/AuthBackButton";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { isLoading, setIsLoading } = useAuthLoading();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(AUTH_CONSTANTS.OTP_EXPIRES_IN);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });

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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrors({ ...errors, email: AUTH_MESSAGES.EMAIL_REQUIRED }); return; }
    if (!validateEmail(email)) { setErrors({ ...errors, email: AUTH_MESSAGES.EMAIL_INVALID }); return; }

    setIsLoading(true);
    try {
      const response = await api.forgotPassword({ email });
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi mã OTP đến email");
        setStep("otp");
        setOtpTimer((response.data as { expiresIn: number }).expiresIn || AUTH_CONSTANTS.OTP_EXPIRES_IN);
        setCanResend(false);
      } else { toast.error(response.message || "Không thể gửi OTP"); }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      const response = await api.resendOtp({ email, otpType: "FORGOT_PASSWORD" });
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi lại mã OTP");
        setOtpTimer((response.data as { expiresIn: number }).expiresIn || AUTH_CONSTANTS.OTP_EXPIRES_IN);
        setCanResend(false);
        setOtpCode("");
      } else { toast.error(response.message || "Không thể gửi lại OTP"); }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== AUTH_CONSTANTS.OTP_LENGTH) { setErrors({ ...errors, otp: AUTH_MESSAGES.OTP_REQUIRED }); return; }
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    let isValid = true;

    if (!newPassword) { newErrors.newPassword = AUTH_MESSAGES.PASSWORD_REQUIRED; isValid = false; }
    else if (!validatePassword(newPassword)) { newErrors.newPassword = AUTH_MESSAGES.PASSWORD_WEAK; isValid = false; }

    if (!confirmPassword) { newErrors.confirmPassword = AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED; isValid = false; }
    else if (confirmPassword !== newPassword) { newErrors.confirmPassword = AUTH_MESSAGES.CONFIRM_PASSWORD_MISMATCH; isValid = false; }

    setErrors(newErrors);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await api.resetPassword({ email, otp: otpCode, newPassword });
      if (response.status === "SUCCESS") {
        toast.success("Đặt lại mật khẩu thành công!");
        setStep("success");
      } else {
        if (response.message?.toLowerCase().includes("otp")) { setErrors({ ...errors, otp: response.message }); setStep("otp"); }
        else { toast.error(response.message || "Không thể đặt lại mật khẩu"); }
      }
    } catch { toast.error(AUTH_MESSAGES.ERROR_GENERIC); }
    finally { setIsLoading(false); }
  };

  if (step === "success") {
    return (
      <div className="w-full">
        <AuthFormHeader 
          icon="check_circle"
          title="Đặt lại mật khẩu thành công" 
          subtitle="Mật khẩu của bạn đã được cập nhật."
          centered 
        />
        <AuthSubmitButton 
          type="button"
          onClick={() => router.push("/login")} 
          isLoading={false} 
          loadingText="" 
          text="Đăng nhập ngay" 
        />
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="w-full">
        <AuthFormHeader 
          title="Đặt mật khẩu mới" 
          subtitle="Nhập mật khẩu mới cho tài khoản của bạn" 
        />

        <form onSubmit={handleResetPassword} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="newPassword" className="text-sm text-gray-600">Mật khẩu mới</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="shield" size={18} className="text-[#00b14f]" /></div>
              <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu mới" value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors({ ...errors, newPassword: "" }); }}
                disabled={isLoading} className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.newPassword ? "border-red-500" : ""}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading}>
                <Icon name={showPassword ? "visibility" : "visibility_off"} size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <AuthFormError error={errors.newPassword} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-sm text-gray-600">Xác nhận mật khẩu</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="shield" size={18} className="text-[#00b14f]" /></div>
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" }); }}
                disabled={isLoading} className={`pl-10 pr-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.confirmPassword ? "border-red-500" : ""}`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading}>
                <Icon name={showConfirmPassword ? "visibility" : "visibility_off"} size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <AuthFormError error={errors.confirmPassword} />
          </div>

          <AuthSubmitButton isLoading={isLoading} loadingText="Đang xử lý..." text="Đặt lại mật khẩu" />
        </form>

        <AuthBackButton onClick={() => setStep("otp")} text="Quay lại" disabled={isLoading} />
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="w-full">
        <AuthFormHeader 
          icon="mark_email_read"
          title="Xác thực email" 
          subtitle={`Chúng tôi đã gửi mã OTP đến email ${email}`}
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
            loadingText="Đang xử lý..." 
            text="Tiếp tục" 
            disabled={otpCode.length !== AUTH_CONSTANTS.OTP_LENGTH}
          />

          <button type="button" onClick={handleResendOtp} disabled={!canResend || isLoading} className={`w-full text-sm ${canResend ? "text-[#00b14f] hover:underline" : "text-gray-400 cursor-not-allowed"}`}>
            Gửi lại mã OTP
          </button>
        </form>

        <AuthBackButton onClick={() => setStep("email")} text="Đổi email khác" disabled={isLoading} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <AuthFormHeader 
        title="Quên mật khẩu" 
        subtitle="Nhập email đã đăng ký để nhận mã xác thực" 
      />

      <form onSubmit={handleRequestOtp} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="mail" size={18} className="text-[#00b14f]" /></div>
            <Input id="email" type="email" placeholder="Nhập email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
              disabled={isLoading} className={`pl-10 h-10 text-sm border-gray-200 focus:border-[#00b14f] focus:ring-0 shadow-none ${errors.email ? "border-red-500" : ""}`} />
          </div>
          <AuthFormError error={errors.email} />
        </div>

        <p className={`text-sm text-gray-600 ${disabledClass}`}>
          Bằng việc thực hiện đổi mật khẩu, bạn đã đồng ý với <Link href="/terms" className={`text-[#00b14f] hover:underline ${disabledClass}`}>Điều khoản dịch vụ</Link> và <Link href="/privacy" className={`text-[#00b14f] hover:underline ${disabledClass}`}>Chính sách bảo mật</Link>
        </p>

        <AuthSubmitButton isLoading={isLoading} loadingText="Đang gửi..." text="Gửi mã xác thực" />
      </form>

      <div className="flex justify-between mt-3">
        <Link href="/login" className={`text-sm text-[#00b14f] hover:underline ${disabledClass}`}>Quay lại đăng nhập</Link>
        <Link href="/register" className={`text-sm text-[#00b14f] hover:underline ${disabledClass}`}>Đăng ký tài khoản mới</Link>
      </div>
    </div>
  );
}
