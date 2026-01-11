"use client";

import { useRef } from "react";

const categories = [
  { 
    id: 1, 
    name: "Kinh doanh - Bán hàng", 
    jobs: 7938,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <rect x="15" y="25" width="40" height="25" rx="3" fill="#00b14f" />
        <circle cx="55" cy="20" r="12" fill="none" stroke="#00b14f" strokeWidth="3" />
        <text x="55" y="24" textAnchor="middle" fill="#00b14f" fontSize="12" fontWeight="bold">$</text>
        <rect x="20" y="30" width="8" height="3" fill="white" />
        <rect x="20" y="36" width="15" height="2" fill="white" opacity="0.7" />
        <rect x="20" y="41" width="12" height="2" fill="white" opacity="0.7" />
      </svg>
    )
  },
  { 
    id: 2, 
    name: "Marketing - PR - Quảng cáo", 
    jobs: 5640,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <path d="M20 35 L35 25 L35 50 L20 40 Z" fill="#2d3748" />
        <rect x="35" y="25" width="20" height="25" fill="#2d3748" />
        <rect x="45" y="15" width="15" height="12" rx="2" fill="#00b14f" />
        <polygon points="52,18 52,24 58,21" fill="white" />
        <circle cx="60" cy="45" r="8" fill="#00b14f" />
        <rect x="57" y="42" width="6" height="6" fill="white" />
      </svg>
    )
  },
  { 
    id: 3, 
    name: "Chăm sóc khách hàng", 
    jobs: 2005,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <circle cx="40" cy="35" r="18" fill="none" stroke="#00b14f" strokeWidth="3" />
        <ellipse cx="40" cy="58" rx="12" ry="4" fill="none" stroke="#00b14f" strokeWidth="3" />
        <path d="M22 35 L18 35 L18 45 L22 45" fill="none" stroke="#00b14f" strokeWidth="3" />
        <path d="M58 35 L62 35 L62 45 L58 45" fill="none" stroke="#00b14f" strokeWidth="3" />
        <circle cx="33" cy="32" r="3" fill="#00b14f" />
        <circle cx="47" cy="32" r="3" fill="#00b14f" />
        <path d="M33 42 Q40 48 47 42" fill="none" stroke="#00b14f" strokeWidth="2" />
      </svg>
    )
  },
  { 
    id: 4, 
    name: "Nhân sự - Hành chính", 
    jobs: 2465,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <rect x="25" y="20" width="30" height="40" rx="3" fill="#2d3748" />
        <rect x="30" y="25" width="20" height="3" fill="#a0aec0" />
        <rect x="30" y="32" width="15" height="2" fill="#a0aec0" />
        <rect x="30" y="38" width="18" height="2" fill="#a0aec0" />
        <rect x="30" y="44" width="12" height="2" fill="#a0aec0" />
        <circle cx="58" cy="25" r="10" fill="#00b14f" />
        <path d="M54 25 L57 28 L63 22" fill="none" stroke="white" strokeWidth="2" />
      </svg>
    )
  },
  { 
    id: 5, 
    name: "Công nghệ Thông tin", 
    jobs: 1892,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <rect x="15" y="30" width="50" height="30" rx="3" fill="#2d3748" />
        <rect x="20" y="35" width="40" height="20" fill="#1a202c" />
        <rect x="30" y="60" width="20" height="5" fill="#2d3748" />
        <rect x="25" y="65" width="30" height="3" fill="#2d3748" />
        <rect x="25" y="20" width="20" height="12" rx="2" fill="#00b14f" />
        <text x="35" y="29" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">IT</text>
        <circle cx="55" cy="26" r="8" fill="#00b14f" opacity="0.3" />
        <path d="M52 26 L55 23 L55 29 L58 26" fill="none" stroke="#00b14f" strokeWidth="1.5" />
      </svg>
    )
  },
  { 
    id: 6, 
    name: "Tài chính - Ngân hàng", 
    jobs: 1283,
    icon: (
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
    )
  },
  { 
    id: 7, 
    name: "Bất động sản", 
    jobs: 343,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <path d="M40 15 L65 35 L65 60 L15 60 L15 35 Z" fill="#2d3748" />
        <rect x="30" y="40" width="20" height="20" fill="#a0aec0" />
        <rect x="35" y="45" width="10" height="15" fill="#1a202c" />
        <rect x="22" y="42" width="6" height="8" fill="#00b14f" />
        <rect x="52" y="42" width="6" height="8" fill="#00b14f" />
        <path d="M40 15 L40 5 L48 5 L48 20" fill="none" stroke="#2d3748" strokeWidth="3" />
      </svg>
    )
  },
  { 
    id: 8, 
    name: "Kế toán - Kiểm toán - Thuế", 
    jobs: 4572,
    icon: (
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        <rect x="20" y="25" width="30" height="35" rx="3" fill="#2d3748" />
        <rect x="25" y="30" width="8" height="5" fill="#a0aec0" />
        <rect x="35" y="30" width="8" height="5" fill="#a0aec0" />
        <rect x="25" y="38" width="8" height="5" fill="#a0aec0" />
        <rect x="35" y="38" width="8" height="5" fill="#a0aec0" />
        <rect x="25" y="46" width="8" height="5" fill="#a0aec0" />
        <rect x="35" y="46" width="8" height="5" fill="#00b14f" />
        <circle cx="55" cy="30" r="12" fill="white" stroke="#00b14f" strokeWidth="2" />
        <circle cx="55" cy="30" r="6" fill="#00b14f" />
        <path d="M55 20 L55 15 M65 30 L70 30 M55 40 L55 45 M45 30 L40 30" stroke="#00b14f" strokeWidth="1" />
        <rect x="50" y="45" width="10" height="15" fill="#00b14f" />
      </svg>
    )
  },
];

export default function Products() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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
          {categories.map((category) => (
            <a
              key={category.id}
              href="#"
              className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg hover:bg-white transition-all group border border-transparent hover:border-gray-200"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                {category.icon}
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
