import { User } from "@/types/user";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

export const defaultUserFields: Partial<User> = {
  coverImage: undefined,
  title: undefined,
  location: undefined,
  company: undefined,
  bio: undefined,
  skills: undefined,
  isVerified: false,
  isOpenToWork: false,
  openToWorkRoles: undefined,
};

export const mapAuthUserToUser = (authUser: AuthUser): User => ({
  id: authUser.id,
  email: authUser.email,
  fullName: authUser.fullName,
  avatar: authUser.avatar,
  ...defaultUserFields,
});
