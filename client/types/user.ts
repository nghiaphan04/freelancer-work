export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  coverImage?: string;
  title?: string;
  location?: string;
  company?: string;
  bio?: string;
  skills?: string[];
  isVerified?: boolean;
  isOpenToWork?: boolean;
  openToWorkRoles?: string[];
}
