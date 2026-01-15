"use client";

import { Suspense } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BannerSlider from "@/components/layout/BannerSlider";
import Products from "@/components/landing/sections/Products";
import HotlineSupport from "@/components/landing/sections/HotlineSupport";
import JobsList from "@/components/jobs/lists/JobsList";
import { Skeleton } from "@/components/ui/skeleton";

function JobsListFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Search skeleton */}
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-12 sm:w-32 rounded-xl" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex gap-3">
              <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        {/* Hero Section */}
        <div className="relative h-[200px] sm:h-[300px] md:h-[400px] mb-6 md:mb-8 overflow-hidden">
          <Image
            src="/landing/slide1.png"
            alt="Jobs Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-3">
                Khám phá việc làm
              </h1>
              <p className="text-gray-200 text-sm sm:text-base md:text-lg">
                Hàng nghìn cơ hội việc làm hấp dẫn đang chờ bạn
              </p>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <Suspense fallback={<JobsListFallback />}>
          <JobsList />
        </Suspense>
      </main>

      {/* Banner Slider */}
      <BannerSlider />

      {/* Products */}
      <Products />

      {/* Hotline Support */}
      <HotlineSupport />

      <Footer />
    </div>
  );
}
