"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUser, clearAuthData } from "@/constant/auth";
import { api } from "@/lib/api";
import { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setIsLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
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
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      isHydrated,
      setIsLoading, 
      setUser,
      logout 
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
