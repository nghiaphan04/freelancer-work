"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";

const jobCategories = [
  { 
    id: 1, 
    name: "Kinh doanh/Bán hàng",
    popular: ["Nhân viên kinh doanh", "Nhân viên bán hàng", "Nhân viên tư vấn", "Telesales", "Sales Admin", "Tư vấn tuyển sinh", "Sales Online"],
    subCategories: [
      { name: "Sales Xuất nhập khẩu/Logistics", tags: ["Sales Logistics", "Sales Xuất nhập khẩu/Logistics khác"] },
      { name: "Sales Bất động sản", tags: ["Sales bất động sản/Môi giới bất động sản", "Sales Bất động sản khác"] },
      { name: "Sales Xây dựng", tags: ["Kinh doanh thiết bị/vật liệu xây dựng", "Kinh doanh nội thất", "Tư vấn thiết kế xây dựng", "Sales Xây dựng khác"] },
    ]
  },
  { 
    id: 2, 
    name: "Marketing/PR/Quảng cáo",
    popular: ["Marketing", "Digital Marketing", "Content Marketing", "SEO", "Graphic Design"],
    subCategories: [
      { name: "Marketing Online", tags: ["Facebook Ads", "Google Ads", "TikTok Marketing"] },
      { name: "Content", tags: ["Content Writer", "Copywriter", "Content Creator"] },
    ]
  },
  { 
    id: 3, 
    name: "Chăm sóc khách hàng (Customer Service)",
    popular: ["Chăm sóc khách hàng", "Tổng đài viên", "CSKH Online"],
    subCategories: []
  },
  { 
    id: 4, 
    name: "Nhân sự/Hành chính/Pháp chế",
    popular: ["Nhân sự", "Hành chính", "Thư ký", "Lễ tân"],
    subCategories: []
  },
  { 
    id: 5, 
    name: "Công nghệ Thông tin",
    popular: ["Developer", "Tester", "BA", "DevOps", "AI Engineer"],
    subCategories: [
      { name: "Lập trình", tags: ["Frontend", "Backend", "Fullstack", "Mobile Dev"] },
      { name: "Quản lý", tags: ["Project Manager", "Product Manager", "Scrum Master"] },
    ]
  },
  { 
    id: 6, 
    name: "Lao động phổ thông",
    popular: ["Công nhân", "Bảo vệ", "Lái xe", "Giao hàng"],
    subCategories: []
  },
  { 
    id: 7, 
    name: "Tài chính/Kế toán",
    popular: ["Kế toán", "Kiểm toán", "Tài chính", "Ngân hàng"],
    subCategories: []
  },
  { 
    id: 8, 
    name: "Thiết kế/Đồ họa",
    popular: ["Graphic Designer", "UI/UX Designer", "3D Designer"],
    subCategories: []
  },
  { 
    id: 9, 
    name: "Giáo dục/Đào tạo",
    popular: ["Giáo viên", "Gia sư", "Đào tạo viên"],
    subCategories: []
  },
  { 
    id: 10, 
    name: "Y tế/Dược phẩm",
    popular: ["Bác sĩ", "Y tá", "Dược sĩ", "Trình dược viên"],
    subCategories: []
  },
  { 
    id: 11, 
    name: "Xây dựng/Kiến trúc",
    popular: ["Kỹ sư xây dựng", "Kiến trúc sư", "Giám sát"],
    subCategories: []
  },
  { 
    id: 12, 
    name: "Logistics/Vận tải",
    popular: ["Logistics", "Xuất nhập khẩu", "Kho vận"],
    subCategories: []
  },
];

const provinces = [
  { id: 1, name: "Hà Nội", districts: ["Ba Đình", "Hoàn Kiếm", "Cầu Giấy", "Đống Đa", "Hai Bà Trưng"] },
  { id: 2, name: "Hồ Chí Minh", districts: ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Thủ Đức"] },
  { id: 3, name: "Bình Dương", districts: ["Thủ Dầu Một", "Dĩ An", "Thuận An", "Tân Uyên"] },
  { id: 4, name: "Bắc Ninh", districts: ["TP Bắc Ninh", "Từ Sơn", "Yên Phong", "Quế Võ"] },
  { id: 5, name: "Đồng Nai", districts: ["Biên Hòa", "Long Khánh", "Nhơn Trạch", "Long Thành"] },
  { id: 6, name: "Hưng Yên", districts: ["TP Hưng Yên", "Văn Lâm", "Văn Giang", "Mỹ Hào"] },
  { id: 7, name: "Hải Dương", districts: ["TP Hải Dương", "Chí Linh", "Kinh Môn", "Nam Sách"] },
  { id: 8, name: "Đà Nẵng", districts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"] },
  { id: 9, name: "Cần Thơ", districts: ["Ninh Kiều", "Cái Răng", "Bình Thủy", "Ô Môn"] },
  { id: 10, name: "Hải Phòng", districts: ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"] },
];

const quickFilters = ["Ngẫu Nhiên", "Hà Nội", "Thành phố Hồ Chí Minh", "Miền Bắc", "Miền Nam"];

const bannerSlides = [
  { id: 1, src: "/landing/slide1.png", alt: "Banner 1" },
  { id: 2, src: "/landing/slide2.png", alt: "Banner 2" },
  { id: 3, src: "/landing/slide3.png", alt: "Banner 3" },
  { id: 4, src: "/landing/slide4.png", alt: "Banner 4" },
];

export default function Hero() {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchProvince, setSearchProvince] = useState("");
  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(jobCategories.length / itemsPerPage);
  
  const currentCategories = jobCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredProvinces = provinces.filter(p => 
    p.name.toLowerCase().includes(searchProvince.toLowerCase())
  );

  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProvince = (id: number) => {
    setSelectedProvinces(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    setSelectedProvince(id);
  };

  const clearAll = () => {
    setSelectedProvinces([]);
    setSelectedDistricts([]);
    setSelectedProvince(null);
  };

  const getSelectedLocationText = () => {
    if (selectedProvinces.length === 0) return "Địa điểm";
    if (selectedProvinces.length === 1) {
      return provinces.find(p => p.id === selectedProvinces[0])?.name || "Địa điểm";
    }
    return `${selectedProvinces.length} địa điểm`;
  };

  return (
    <section className="relative bg-gradient-to-br from-[#0d3d2e] via-[#0a4a37] to-[#063d2d] py-6 z-10">
      {/* Background Circuit Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-20" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="100" x2="300" y2="100" stroke="#00b14f" strokeWidth="1" />
        <line x1="0" y1="200" x2="200" y2="200" stroke="#00b14f" strokeWidth="1" />
        <line x1="0" y1="400" x2="250" y2="400" stroke="#00b14f" strokeWidth="1" />
        <line x1="900" y1="150" x2="1200" y2="150" stroke="#00b14f" strokeWidth="1" />
        <line x1="950" y1="350" x2="1200" y2="350" stroke="#00b14f" strokeWidth="1" />
        <line x1="1000" y1="500" x2="1200" y2="500" stroke="#00b14f" strokeWidth="1" />
        <circle cx="300" cy="100" r="4" fill="#00b14f" />
        <circle cx="200" cy="200" r="4" fill="#00b14f" />
        <circle cx="250" cy="400" r="4" fill="#00b14f" />
        <circle cx="900" cy="150" r="4" fill="#00b14f" />
        <circle cx="950" cy="350" r="4" fill="#00b14f" />
        <circle cx="1000" cy="500" r="4" fill="#00b14f" />
        <path d="M50 50 L100 50 L100 100" fill="none" stroke="#00b14f" strokeWidth="2" />
        <path d="M1150 50 L1100 50 L1100 100" fill="none" stroke="#00b14f" strokeWidth="2" />
        <path d="M50 550 L100 550 L100 500" fill="none" stroke="#00b14f" strokeWidth="2" />
        <path d="M1150 550 L1100 550 L1100 500" fill="none" stroke="#00b14f" strokeWidth="2" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-[100]">
        
        {/* Search Bar */}
        <div className="bg-white rounded-full p-1.5 flex items-center gap-2 mb-6 shadow-lg relative z-[9999]">
          <div className="flex-1 flex items-center px-4">
            <Icon name="search" size={20} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Vị trí tuyển dụng, tên công ty"
              className="w-full py-2 outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          
          {/* Location Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="hidden sm:flex items-center border-l border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <Icon name="location_on" size={20} className="text-gray-400 mr-2" />
              <span className="text-gray-700">{getSelectedLocationText()}</span>
              <Icon name={showLocationDropdown ? "expand_less" : "expand_more"} size={20} className="text-gray-400 ml-1" />
            </button>

            {/* Location Dropdown */}
            {showLocationDropdown && (
              <div className="absolute top-full right-0 mt-2 w-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden">
                <div className="flex">
                  {/* Left Panel - Provinces */}
                  <div className="w-1/2 border-r border-gray-200">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex items-center bg-gray-50 rounded-full px-4 py-2">
                        <Icon name="search" size={18} className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          placeholder="Nhập Tỉnh/Thành phố"
                          value={searchProvince}
                          onChange={(e) => setSearchProvince(e.target.value)}
                          className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    {/* Province List */}
                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {filteredProvinces.map((province) => (
                        <div
                          key={province.id}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedProvince === province.id ? "bg-green-50" : ""
                          }`}
                          onClick={() => toggleProvince(province.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedProvinces.includes(province.id)
                                ? "bg-[#00b14f] border-[#00b14f]"
                                : "border-gray-300"
                            }`}>
                              {selectedProvinces.includes(province.id) && (
                                <Icon name="check" size={14} className="text-white" />
                              )}
                            </div>
                            <span className="text-gray-700 text-sm">{province.name}</span>
                          </div>
                          <Icon name="chevron_right" size={18} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Districts */}
                  <div className="w-1/2">
                    <div className="p-3 border-b border-gray-100">
                      <span className="text-[#00b14f] font-semibold text-sm">QUẬN/HUYỆN</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {selectedProvince ? (
                        <div className="space-y-2">
                          {provinces.find(p => p.id === selectedProvince)?.districts.map((district, idx) => (
                            <label key={idx} className="flex items-center gap-3 cursor-pointer py-2 hover:bg-gray-50 px-2 rounded">
                              <input
                                type="checkbox"
                                checked={selectedDistricts.includes(district)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDistricts([...selectedDistricts, district]);
                                  } else {
                                    setSelectedDistricts(selectedDistricts.filter(d => d !== district));
                                  }
                                }}
                                className="w-4 h-4 accent-[#00b14f]"
                              />
                              <span className="text-gray-700 text-sm">{district}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                          <Icon name="location_city" size={48} className="mb-3 opacity-50" />
                          <span className="text-sm">Vui lòng chọn Tỉnh/Thành phố</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

               

       
              </div>
            )}
          </div>

          <button className="bg-[#00b14f] hover:bg-[#009643] text-white px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-colors">
            <Icon name="search" size={18} />
            <span>Tìm kiếm</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10"
          onMouseLeave={() => setHoveredCategory(null)}
        >
          
          {/* Left Sidebar - Job Categories */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-visible relative z-20">
            <div className="divide-y divide-gray-100 rounded-t-xl overflow-hidden">
              {currentCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                >
                  <a
                    href="#"
                    className={`flex items-center justify-between px-4 py-3.5 transition-colors group ${
                      hoveredCategory === category.id ? "bg-gray-50 text-[#00b14f]" : "hover:bg-gray-50"
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
                  </a>
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
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_left" size={18} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_right" size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Hover Dropdown - Covers Banner Area */}
          {hoveredCategory && (
            <div 
              className="absolute left-[25%] top-0 right-0 bottom-0 bg-white rounded-r-xl shadow-xl border border-gray-200 z-[9999] hidden lg:flex flex-col overflow-hidden"
              onMouseEnter={() => {}}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {(() => {
                const category = jobCategories.find(c => c.id === hoveredCategory);
                if (!category) return null;
                return (
                  <div className="p-5 overflow-y-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Popular Tags */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Được tìm kiếm nhiều</h4>
                      <div className="flex flex-wrap gap-2">
                        {category.popular.map((tag, idx) => (
                          <a
                            key={idx}
                            href="#"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#00b14f] hover:text-[#00b14f] transition-colors"
                          >
                            <Icon name="check_circle" size={16} className="text-[#00b14f]" />
                            {tag}
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Sub Categories */}
                    {category.subCategories.length > 0 && (
                      <div className="space-y-4">
                        {category.subCategories.map((subCat, idx) => (
                          <div key={idx}>
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">{subCat.name}</h5>
                            <div className="flex flex-wrap gap-2">
                              {subCat.tags.map((tag, tIdx) => (
                                <a
                                  key={tIdx}
                                  href="#"
                                  className="px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600 hover:bg-[#e8f5e9] hover:text-[#00b14f] transition-colors"
                                >
                                  {tag}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scroll hint */}
                    <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                      <a href="#" className="inline-flex items-center gap-1 text-sm text-[#00b14f] hover:underline">
                        <Icon name="expand_more" size={16} />
                        Cuộn để xem
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Right Content - Banner Slider */}
          <div className="lg:col-span-9">
            <div className="relative rounded-xl overflow-hidden h-full min-h-[280px]">
              {/* Slides */}
              {bannerSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <Icon name="chevron_left" size={24} />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <Icon name="chevron_right" size={24} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {bannerSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentSlide
                        ? "bg-[#00b14f] w-6"
                        : "bg-white/60 hover:bg-white"
                    }`}
                  />
                ))}
              </div>

              {/* Badge */}
              <div className="absolute bottom-4 right-4 bg-[#00b14f] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-10">
                Welcome onboard!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
