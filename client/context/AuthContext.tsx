"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getUser, clearAuthData, saveAuthData } from "@/constant/auth";
import { api } from "@/lib/api";
import { User } from "@/types/user";

type WalletLoginResult = { success: true } | { success: false; needName?: boolean; error?: string };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setIsLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  loginWithWallet: (walletAddress: string, publicKey: string, signature: string, message: string, fullName?: string) => Promise<WalletLoginResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) setUser(savedUser);
    setIsHydrated(true);
  }, []);

  const logout = async () => {
    await api.logout();
    clearAuthData();
    setUser(null);
    window.location.href = "/";
  };

  const loginWithWallet = useCallback(async (
    walletAddress: string,
    publicKey: string,
    signature: string,
    message: string,
    fullName?: string
  ): Promise<WalletLoginResult> => {
    try {
      const response = await api.walletLogin({ walletAddress, publicKey, signature, message, fullName });
      
      if (response.status === "NEED_NAME") {
        return { success: false, needName: true };
      }
      
      if (response.status === "SUCCESS" && response.data) {
        const data = response.data as { user: User; accessToken: string };
        saveAuthData({ user: data.user, accessToken: data.accessToken });
        setUser(data.user);
        return { success: true };
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      console.error("Wallet login error:", error);
      return { success: false, error: "Đăng nhập thất bại" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      isHydrated,
      setIsLoading, 
      setUser,
      logout,
      loginWithWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useAuthLoading() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthLoading must be used within AuthProvider");
  return { isLoading: context.isLoading, setIsLoading: context.setIsLoading };
}
