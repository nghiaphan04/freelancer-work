"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { BlogArticle } from "@/types/blog";
import { blogArticles } from "@/constant/blog";

// Article card component with different sizes - Full image with overlay
function ArticleCard({ 
  article, 
  size = "small" 
}: { 
  article: BlogArticle; 
  size?: "large" | "medium" | "small" 
}) {
  const isLarge = size === "large";

  return (
    <Link
      href={`/blog/${article.id}`}
      className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full block"
    >
      {/* Full Background Image */}
      <Image
        src={article.image}
        alt={article.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        {/* Title & Meta */}
        <div>
          <h3 className={`font-semibold text-white mb-2 ${
            isLarge ? "text-xl line-clamp-3" : "text-sm line-clamp-2"
          }`}>
            {article.title}
          </h3>
          {isLarge && (
            <p className="text-gray-200 text-sm mb-3 line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className={`flex items-center justify-between text-gray-300 ${isLarge ? "text-xs" : "text-[10px]"}`}>
            <span className="flex items-center gap-1">
              <Icon name="calendar_today" size={isLarge ? 14 : 12} />
              {article.date}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="schedule" size={isLarge ? 14 : 12} />
              {article.readTime}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BlogGrid() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={(e) => e.preventDefault()} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết theo tiêu đề, chủ đề..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/20 transition-all bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#00b14f] hover:bg-[#009643] text-white font-medium rounded-xl flex items-center gap-2 transition-colors"
          >
            <Icon name="search" size={20} />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </button>
        </div>
      </form>

      {/* Blog Grid - Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
      
      {/* Mobile Layout - Simple Stack */}
      <div className="grid grid-cols-1 gap-2 md:hidden">
        {blogArticles.map((article, idx) => (
          <div key={article.id} className={idx === 0 ? "h-[300px]" : "h-[200px]"}>
            <ArticleCard article={article} size={idx === 0 ? "large" : "medium"} />
          </div>
        ))}
      </div>

      {/* Tablet Layout - 2 cols */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-2">
        {blogArticles.map((article, idx) => (
          <div key={article.id} className={idx === 0 ? "col-span-2 h-[350px]" : "h-[200px]"}>
            <ArticleCard article={article} size={idx === 0 ? "large" : "medium"} />
          </div>
        ))}
      </div>

      {/* Desktop Layout - 4 cols with complex grid */}
      <div 
        className="hidden lg:grid grid-cols-4 gap-2"
        style={{ gridAutoRows: "60px" }}
      >
        {/* Article 1 - Large featured (2 cols, 6 rows) */}
        <div className="col-span-2 row-span-6">
          <ArticleCard article={blogArticles[0]} size="large" />
        </div>

        {/* Article 2 (2 cols, 2 rows) */}
        <div className="col-span-2 row-span-2">
          <ArticleCard article={blogArticles[1]} size="medium" />
        </div>

        {/* Article 3 (2 cols, 2 rows) */}
        <div className="col-span-2 row-span-2">
          <ArticleCard article={blogArticles[2]} size="medium" />
        </div>

        {/* Article 4 (2 cols, 2 rows) */}
        <div className="col-span-2 row-span-2">
          <ArticleCard article={blogArticles[3]} size="medium" />
        </div>

        {/* Article 5 (2 cols, 2 rows) */}
        <div className="col-span-2 row-span-2">
          <ArticleCard article={blogArticles[4]} size="medium" />
        </div>

        {/* Article 6 (2 cols, 2 rows) */}
        <div className="col-span-2 row-span-2">
          <ArticleCard article={blogArticles[5]} size="medium" />
        </div>

        {/* Articles 7-10 (1 col, 3 rows each) */}
        <div className="row-span-3">
          <ArticleCard article={blogArticles[6]} size="small" />
        </div>
        <div className="row-span-3">
          <ArticleCard article={blogArticles[7]} size="small" />
        </div>
        <div className="row-span-3">
          <ArticleCard article={blogArticles[8]} size="small" />
        </div>
        <div className="row-span-3">
          <ArticleCard article={blogArticles[9]} size="small" />
        </div>

        {/* Articles 11-14 (1 col, 3 rows each) */}
        <div className="row-span-3">
          <ArticleCard article={blogArticles[10]} size="small" />
        </div>
        <div className="row-span-3">
          <ArticleCard article={blogArticles[11]} size="small" />
        </div>
        <div className="row-span-3">
          <ArticleCard article={blogArticles[12]} size="small" />
        </div>
        <div className="row-span-3">
          <ArticleCard article={blogArticles[13]} size="small" />
        </div>
      </div>

      {/* Load More Button */}
      <div className="text-center mt-10">
        <button className="px-8 py-3 bg-white border-2 border-[#00b14f] text-[#00b14f] font-semibold rounded-full hover:bg-[#00b14f] hover:text-white transition-colors">
          Xem thêm bài viết
        </button>
      </div>
    </div>
  );
}
