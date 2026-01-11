"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api";
import { saveAuthData } from "@/constant/auth";
import { useAuth, useAuthLoading } from "@/context/AuthContext";

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
          saveAuthData(response.data);
          setUser(response.data.user);
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
