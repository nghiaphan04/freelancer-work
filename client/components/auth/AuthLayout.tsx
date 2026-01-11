"use client";

import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useAuthLoading } from "@/context/AuthContext";
import SocialLoginButtons from "./SocialLoginButtons";

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthLoading();

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl">
      {children}
      <SocialLoginButtons disabled={isLoading} />
    </div>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      <div className="lg:hidden h-40 relative overflow-hidden">
        <Image src="/landing/slide1.png" alt="Freelancer" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/50" />
        <Link href="/" className="absolute top-4 left-4 z-10 flex items-center gap-1 text-white text-sm hover:underline">
          <Icon name="arrow_back" size={18} />
          <span>Trang chủ</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-5 bg-white lg:overflow-hidden">
        <Link href="/" className="hidden lg:flex items-center gap-1 text-gray-600 text-sm hover:text-[#00b14f] mb-3 w-fit">
          <Icon name="arrow_back" size={18} />
          <span>Trang chủ</span>
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <AuthContent>{children}</AuthContent>
        </div>
      </div>

      <div className="hidden lg:block lg:w-[480px] xl:w-[560px] relative">
        <Image src="/landing/banner.png" alt="Freelancer" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/50" />
      </div>
    </div>
  );
}
