"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { jobCategories } from "@/constant/landing";

export default function JobCategoriesSidebar() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(jobCategories.length / itemsPerPage);
  
  const currentCategories = jobCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleMouseEnterCategory = (categoryId: number) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredCategory(categoryId);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 300);
  };

  const handleMouseEnterDropdown = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  return (
    <div 
      className="relative z-50"
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible relative">


        {/* Categories List */}
        <div className="divide-y divide-gray-100">
          {currentCategories.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleMouseEnterCategory(category.id)}
            >
              <Link
                href={`/jobs?category=${category.id}`}
                className={`flex items-center justify-between px-4 py-3 transition-colors group ${
                  hoveredCategory === category.id ? "bg-[#00b14f]/5 text-[#00b14f]" : "hover:bg-gray-50"
                }`}
              >
                <span className={`text-sm truncate pr-2 ${
                  hoveredCategory === category.id ? "text-[#00b14f] font-medium" : "text-gray-700 group-hover:text-[#00b14f]"
                }`}>
                  {category.name}
                </span>
                <Icon name="chevron_right" size={18} className={`shrink-0 ${
                  hoveredCategory === category.id ? "text-[#00b14f]" : "text-gray-400"
                }`} />
              </Link>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">{currentPage}/{totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="chevron_left" size={18} className="text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="chevron_right" size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover Dropdown with invisible bridge */}
      {hoveredCategory && (
        <div 
          className="absolute left-full top-0 pl-3 z-[9999] hidden lg:block"
          onMouseEnter={handleMouseEnterDropdown}
        >
          <div className="w-[350px] bg-white rounded-xl shadow-xl border border-gray-200 animate-in fade-in-0 slide-in-from-left-2 duration-200">
          {(() => {
            const category = jobCategories.find(c => c.id === hoveredCategory);
            if (!category) return null;
            return (
              <div 
                className="p-4 max-h-[400px] overflow-y-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Category Title */}
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Icon name="work" size={18} className="text-[#00b14f]" />
                  {category.name}
                </h4>

                {/* Popular Tags */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Được tìm kiếm nhiều</p>
                  <div className="flex flex-wrap gap-2">
                    {category.popular.map((tag, idx) => (
                      <Link
                        key={idx}
                        href={`/jobs?keyword=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-full text-xs text-gray-600 hover:border-[#00b14f] hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="check_circle" size={12} className="text-[#00b14f]" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sub Categories */}
                {category.subCategories.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    {category.subCategories.map((subCat, idx) => (
                      <div key={idx}>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">{subCat.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {subCat.tags.map((tag, tIdx) => (
                            <Link
                              key={tIdx}
                              href={`/jobs?keyword=${encodeURIComponent(tag)}`}
                              className="px-2.5 py-1 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-[#e8f5e9] hover:text-[#00b14f] transition-colors"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* View All */}
                <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                  <Link 
                    href={`/jobs?category=${category.id}`}
                    className="inline-flex items-center gap-1 text-sm text-[#00b14f] hover:underline font-medium"
                  >
                    Xem tất cả
                    <Icon name="arrow_forward" size={16} />
                  </Link>
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      )}
    </div>
  );
}
