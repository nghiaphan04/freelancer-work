"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileAbout from "@/components/profile/ProfileAbout";
import ProfileSkills from "@/components/profile/ProfileSkills";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  const { user, isLoading, updateProfile, fetchProfile } = useProfile();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      fetchProfile();
    }
  }, [isHydrated, isAuthenticated, fetchProfile]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <ProfileCard user={user} onUpdate={updateProfile} isLoading={isLoading} />
          <ProfileAbout bio={user.bio} onUpdate={updateProfile} isLoading={isLoading} />
          <ProfileSkills skills={user.skills} onUpdate={updateProfile} isLoading={isLoading} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
