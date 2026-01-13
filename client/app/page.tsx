"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/sections/Hero";
import Features from "@/components/landing/sections/Features";
import Products from "@/components/landing/sections/Products";
import AppDownload from "@/components/landing/sections/AppDownload";
import HotlineSupport from "@/components/landing/sections/HotlineSupport";
import Partners from "@/components/landing/sections/Partners";
import AboutSection from "@/components/landing/sections/AboutSection";
// import PopularKeywords from "@/components/landing/sections/PopularKeywords";

export default function Home() {
  const router = useRouter();
  const { user, isHydrated } = useAuth();

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  useEffect(() => {
    if (isHydrated && isAdmin) {
      router.push("/admin");
    }
  }, [isHydrated, isAdmin, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />
        <Partners />
        <Products />
       
        <AppDownload />
        <Features />
        <AboutSection />
      
        <HotlineSupport />
        {/* <PopularKeywords /> */}
      </main>

      <Footer />
    </div>
  );
}
