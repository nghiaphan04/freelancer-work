"use client";

import { Suspense } from "react";
import Header from "@/components/layout/Header";
import MessagesContainer from "@/components/messages/MessagesContainer";
import { Skeleton } from "@/components/ui/skeleton";

function MessagesLoading() {
  return (
    <div className="bg-white h-[calc(100dvh-64px)] md:h-full overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-96 border-r border-gray-200 p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full rounded-full" />
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
        {/* Chat skeleton - hidden on mobile */}
        <div className="hidden md:block flex-1 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen md:min-h-0 md:h-screen md:max-h-screen md:overflow-hidden bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 md:overflow-hidden">
        <div className="w-full h-full">
          <Suspense fallback={<MessagesLoading />}>
            <MessagesContainer />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
