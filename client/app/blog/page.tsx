"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BlogHero from "@/components/blog/sections/BlogHero";
import BlogGrid from "@/components/blog/sections/BlogGrid";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <BlogHero />
        <BlogGrid />
      </main>

      <Footer />
    </div>
  );
}
