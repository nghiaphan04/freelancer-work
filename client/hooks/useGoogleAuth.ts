"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api";
import { saveAuthData } from "@/constant/auth";
import { useAuth, useAuthLoading } from "@/context/AuthContext";
import { User } from "@/types/user";

export function useGoogleAuth() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { setIsLoading } = useAuthLoading();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await api.googleAuth(tokenResponse.access_token);
        if (response.status === "SUCCESS") {
          const responseData = response.data as { user: User; accessToken?: string };
          saveAuthData({ user: responseData.user, accessToken: responseData.accessToken });
          setUser(responseData.user);
          toast.success("Đăng nhập thành công!");
          router.push("/");
        } else {
          toast.error(response.message || "Đăng nhập thất bại");
        }
      } catch {
        toast.error("Có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Đăng nhập Google thất bại"),
  });

  return { login };
}
