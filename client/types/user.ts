export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  title?: string;
  location?: string;
  company?: string;
  bio?: string;
  skills?: string[];
  isVerified?: boolean;
  isOpenToWork?: boolean;
  openToWorkRoles?: string[];
  emailVerified?: boolean;
  enabled?: boolean;
  roles?: string[];
  credits?: number;
  balance?: number;
  hasBankInfo?: boolean;
  bankAccountNumber?: string;
  bankName?: string;
  trustScore?: number;
  untrustScore?: number;
}

export type UserRole = "ROLE_ADMIN" | "ROLE_EMPLOYER" | "ROLE_FREELANCER";

export const ROLE_CONFIG: Record<string, { label: string; description: string }> = {
  ROLE_ADMIN: { label: "Quản trị", description: "Quản trị viên hệ thống" },
  ROLE_EMPLOYER: { label: "Bên thuê", description: "Người đăng việc" },
  ROLE_FREELANCER: { label: "Người nhận việc", description: "Người làm việc tự do" },
};

export const getRoleLabel = (role: string): string => {
  return ROLE_CONFIG[role]?.label || role.replace("ROLE_", "");
};
