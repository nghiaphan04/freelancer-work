import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { User } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { saveAuthData } from "@/constant/auth";

export function useProfile() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getProfile();
      if (response.status === "SUCCESS" && response.data) {
        setUser(response.data);
        saveAuthData({ user: response.data });
      }
    } catch (err) {
      setError("Không thể tải thông tin profile");
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.updateProfile(data);
      if (response.status === "SUCCESS" && response.data) {
        setUser(response.data);
        saveAuthData({ user: response.data });
        return true;
      }
      setError(response.message || "Cập nhật thất bại");
      return false;
    } catch (err) {
      setError("Không thể cập nhật profile");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const becomeEmployer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.becomeEmployer();
      if (response.status === "SUCCESS" && response.data) {
        setUser(response.data);
        saveAuthData({ user: response.data });
        return true;
      }
      setError(response.message || "Đăng ký thất bại");
      return false;
    } catch {
      setError("Không thể đăng ký");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  return {
    user,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    becomeEmployer,
  };
}
