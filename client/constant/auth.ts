export const AUTH_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRES_IN: 600,
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
}

export const AUTH_REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
}

export const AUTH_MESSAGES = {
  EMAIL_REQUIRED: "Vui lòng nhập email",
  EMAIL_INVALID: "Email không hợp lệ",
  PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu",
  PASSWORD_WEAK: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
  PASSWORD_MIN: "Mật khẩu phải có ít nhất 6 ký tự",
  CONFIRM_PASSWORD_REQUIRED: "Vui lòng xác nhận mật khẩu",
  CONFIRM_PASSWORD_MISMATCH: "Mật khẩu xác nhận không khớp",
  FULLNAME_REQUIRED: "Vui lòng nhập họ tên",
  FULLNAME_MIN: "Họ tên phải có ít nhất 2 ký tự",
  TERMS_REQUIRED: "Vui lòng đồng ý với điều khoản",
  OTP_REQUIRED: "Vui lòng nhập mã OTP 6 số",
  OTP_EXPIRED: "Mã OTP đã hết hạn",
  ERROR_GENERIC: "Có lỗi xảy ra.",
}

export const validateEmail = (email: string) => AUTH_REGEX.EMAIL.test(email)

export const validatePassword = (password: string) => AUTH_REGEX.PASSWORD.test(password)

export const formatOtpTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`

export const saveAuthData = (data: { user: unknown; accessToken?: string }) => {
  localStorage.setItem("user", JSON.stringify(data.user))
  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken)
  }
}

export const clearAuthData = () => {
  localStorage.removeItem("user")
  localStorage.removeItem("accessToken")
}

export const getUser = () => {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export const getAccessToken = () => {
  return localStorage.getItem("accessToken")
}
