"use client";

import { useRef } from "react";
import { productCategories } from "@/constant/landing";

const categoryIcons: Record<string, React.ReactNode> = {
  dev: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <rect x="15" y="30" width="50" height="30" rx="3" fill="#2d3748" />
      <rect x="20" y="35" width="40" height="20" fill="#1a202c" />
      <rect x="30" y="60" width="20" height="5" fill="#2d3748" />
      <rect x="25" y="65" width="30" height="3" fill="#2d3748" />
      <text x="28" y="48" fill="#00b14f" fontSize="8" fontFamily="monospace">&lt;/&gt;</text>
      <circle cx="55" cy="26" r="10" fill="#00b14f" />
      <path d="M51 26 L54 23 L54 29 M59 26 L56 23 L56 29" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  ),
  design: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <rect x="20" y="20" width="40" height="40" rx="3" fill="#2d3748" />
      <circle cx="35" cy="35" r="8" fill="#00b14f" />
      <rect x="45" y="45" width="10" height="10" fill="#00b14f" opacity="0.6" />
      <path d="M55 25 L60 20 L65 25 L60 65 L55 60 Z" fill="#00b14f" />
      <path d="M60 20 L60 15" stroke="#2d3748" strokeWidth="2" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <circle cx="40" cy="40" r="20" fill="none" stroke="#2d3748" strokeWidth="3" />
      <circle cx="40" cy="40" r="8" fill="#00b14f" />
      <path d="M40 20 L40 15 M40 60 L40 65 M20 40 L15 40 M60 40 L65 40" stroke="#00b14f" strokeWidth="2" />
      <circle cx="28" cy="28" r="4" fill="#00b14f" opacity="0.6" />
      <circle cx="52" cy="28" r="4" fill="#00b14f" opacity="0.6" />
      <circle cx="28" cy="52" r="4" fill="#00b14f" opacity="0.6" />
      <circle cx="52" cy="52" r="4" fill="#00b14f" opacity="0.6" />
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <path d="M20 35 L35 25 L35 50 L20 40 Z" fill="#2d3748" />
      <rect x="35" y="25" width="20" height="25" fill="#2d3748" />
      <rect x="45" y="15" width="15" height="12" rx="2" fill="#00b14f" />
      <polygon points="52,18 52,24 58,21" fill="white" />
      <circle cx="60" cy="45" r="8" fill="#00b14f" />
      <path d="M57 45 L60 48 L64 42" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  ),
  writing: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <rect x="20" y="15" width="35" height="50" rx="3" fill="#2d3748" />
      <rect x="25" y="22" width="25" height="3" fill="#a0aec0" />
      <rect x="25" y="30" width="20" height="2" fill="#a0aec0" />
      <rect x="25" y="36" width="22" height="2" fill="#a0aec0" />
      <rect x="25" y="42" width="18" height="2" fill="#a0aec0" />
      <rect x="25" y="48" width="20" height="2" fill="#a0aec0" />
      <path d="M55 30 L65 20 L70 25 L60 65 L50 60 Z" fill="#00b14f" />
      <path d="M65 20 L68 17" stroke="#2d3748" strokeWidth="2" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <rect x="25" y="20" width="30" height="40" rx="3" fill="#2d3748" />
      <rect x="30" y="25" width="20" height="3" fill="#a0aec0" />
      <rect x="30" y="32" width="15" height="2" fill="#a0aec0" />
      <rect x="30" y="38" width="18" height="2" fill="#a0aec0" />
      <rect x="30" y="44" width="12" height="2" fill="#a0aec0" />
      <circle cx="58" cy="25" r="10" fill="#00b14f" />
      <path d="M54 25 L57 28 L63 22" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <path d="M40 15 L60 25 L60 30 L20 30 L20 25 Z" fill="#2d3748" />
      <rect x="22" y="30" width="36" height="25" fill="#2d3748" />
      <rect x="27" y="35" width="6" height="18" fill="#a0aec0" />
      <rect x="37" y="35" width="6" height="18" fill="#a0aec0" />
      <rect x="47" y="35" width="6" height="18" fill="#a0aec0" />
      <rect x="20" y="55" width="40" height="5" fill="#2d3748" />
      <circle cx="55" cy="45" r="10" fill="#00b14f" />
      <text x="55" y="49" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">$</text>
    </svg>
  ),
  legal: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <rect x="35" y="15" width="10" height="50" fill="#2d3748" />
      <rect x="20" y="25" width="40" height="8" fill="#2d3748" />
      <circle cx="25" cy="45" r="8" fill="#00b14f" />
      <circle cx="55" cy="45" r="8" fill="#00b14f" />
      <rect x="22" y="53" width="6" height="10" fill="#a0aec0" />
      <rect x="52" y="53" width="6" height="10" fill="#a0aec0" />
      <circle cx="40" cy="20" r="5" fill="#00b14f" />
    </svg>
  ),
  hr: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <circle cx="30" cy="25" r="10" fill="#2d3748" />
      <ellipse cx="30" cy="50" rx="15" ry="12" fill="#2d3748" />
      <circle cx="55" cy="30" r="8" fill="#00b14f" opacity="0.8" />
      <ellipse cx="55" cy="52" rx="12" ry="10" fill="#00b14f" opacity="0.8" />
      <circle cx="65" cy="25" r="6" fill="#a0aec0" />
      <ellipse cx="65" cy="42" rx="8" ry="6" fill="#a0aec0" />
    </svg>
  ),
  engineering: (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <path d="M40 15 L65 35 L65 60 L15 60 L15 35 Z" fill="#2d3748" />
      <rect x="30" y="40" width="20" height="20" fill="#a0aec0" />
      <rect x="35" y="45" width="10" height="15" fill="#1a202c" />
      <rect x="22" y="42" width="6" height="8" fill="#00b14f" />
      <rect x="52" y="42" width="6" height="8" fill="#00b14f" />
      <circle cx="60" cy="20" r="8" fill="#00b14f" />
      <path d="M57 20 L60 17 L60 23 M63 20 L60 17 L60 23" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  ),
};

export default function Products() {
  const scrollRef = useRef<HTMLDivElement>(null);

 
  return (
    <section className="py-10 bg-white relative z-0">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#00b14f] mb-1">
              Top ngành nghề nổi bật
            </h2>
            <p className="text-sm text-gray-600">
              Bạn muốn tìm việc mới? Xem danh sách việc làm{" "}
              <a href="#" className="text-[#00b14f] hover:underline">tại đây</a>
            </p>
          </div>
          
       
        </div>

        {/* Categories Grid */}
        <div 
          ref={scrollRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {productCategories.map((category) => (
            <a
              key={category.id}
              href="#"
              className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg hover:bg-white transition-all group border border-transparent hover:border-gray-200"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                {categoryIcons[category.iconType]}
              </div>
              
              {/* Category Name */}
              <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">
                {category.name}
              </h3>
              
              {/* Job Count */}
              <p className="text-[#00b14f] font-semibold">
                {category.jobs.toLocaleString("vi-VN")} việc làm
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
