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
}
