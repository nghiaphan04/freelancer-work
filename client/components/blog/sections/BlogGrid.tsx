"use client";

import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { blogArticles } from "@/constant/blog";
import TextCard from "../cards/TextCard";
import KnowledgeCard from "../cards/KnowledgeCard";
import BlogBanner from "./BlogBanner";

export default function BlogGrid() {
  const section1 = blogArticles.slice(0, 4);  // First 4 - Featured
  const section2 = blogArticles.slice(4, 6);  // Next 2 - Xu hướng
  const section3 = blogArticles.slice(6, 10); // Next 4 - Kiến thức chuyên ngành
  const section4 = blogArticles.slice(10);    // Remaining - Chế độ lương thưởng

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Section 1: Bài viết nổi bật */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bài viết nổi bật</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Large featured - left */}
              <TextCard article={section1[0]} showImage titleSize="lg" />
              
              {/* 3 small cards - right */}
              <div className="grid grid-cols-1 gap-3">
                {section1.slice(1, 4).map((article) => (
                  <TextCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section2.map((article) => (
              <TextCard key={article.id} article={article} titleSize="lg" />
            ))}
          </div>

          <Link 
            href="/blog" 
            className="flex items-center justify-center gap-2 w-full py-3 mt-8 border-2 border-[#00b14f] text-[#00b14f] rounded-lg hover:bg-[#00b14f] hover:text-white transition-colors font-medium"
          >
            Xem thêm bài viết
            <Icon name="arrow_forward" size={20} />
          </Link>
        </div>
      </div>

      {/* Section 3: Kiến thức chuyên ngành - Full width with background image */}
      {section3.length > 0 && (
        <div className="relative py-12 mt-8">
          {/* Background Image */}
          <Image
            src="/landing/slide1.png"
            alt="Background"
            fill
            className="object-cover"
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70" />
          
          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Kiến thức chuyên ngành</h2>
              <Link href="/blog" className="text-white hover:text-white/80 flex items-center gap-1 text-sm font-medium">
                Xem tất cả
                <Icon name="chevron_right" size={20} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {section3.map((article) => (
                <KnowledgeCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Chế độ lương thưởng */}
      {section4.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chế độ lương thưởng</h2>
            <Link href="/blog" className="text-gray-600 hover:text-[#00b14f] flex items-center gap-1 text-sm font-medium">
              Xem tất cả
              <Icon name="chevron_right" size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {section4.map((article) => (
              <TextCard key={article.id} article={article} showImage />
            ))}
          </div>
        </div>
      )}

      {/* Banner: Trắc nghiệm tính cách */}
      <BlogBanner />
    </>
  );
}
