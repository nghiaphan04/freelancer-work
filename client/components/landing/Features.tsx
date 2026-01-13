"use client";

import Image from "next/image";
import { stats } from "@/constant/landing";

export default function Features() {
  return (
    <section className="relative bg-gradient-to-br from-[#0d3d2e] via-[#0a4a37] to-[#063d2d] py-16 overflow-hidden">
      {/* Background Circuit Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        {/* Horizontal lines */}
        <line x1="0" y1="100" x2="300" y2="100" stroke="#00b14f" strokeWidth="1" />
        <line x1="0" y1="200" x2="200" y2="200" stroke="#00b14f" strokeWidth="1" />
        <line x1="0" y1="400" x2="250" y2="400" stroke="#00b14f" strokeWidth="1" />
        <line x1="900" y1="150" x2="1200" y2="150" stroke="#00b14f" strokeWidth="1" />
        <line x1="950" y1="350" x2="1200" y2="350" stroke="#00b14f" strokeWidth="1" />
        <line x1="1000" y1="500" x2="1200" y2="500" stroke="#00b14f" strokeWidth="1" />
        
        {/* Dots on lines */}
        <circle cx="300" cy="100" r="4" fill="#00b14f" />
        <circle cx="200" cy="200" r="4" fill="#00b14f" />
        <circle cx="250" cy="400" r="4" fill="#00b14f" />
        <circle cx="900" cy="150" r="4" fill="#00b14f" />
        <circle cx="950" cy="350" r="4" fill="#00b14f" />
        <circle cx="1000" cy="500" r="4" fill="#00b14f" />
        
        {/* Corner decorations */}
        <path d="M50 50 L100 50 L100 100" fill="none" stroke="#00b14f" strokeWidth="2" />
        <path d="M1150 50 L1100 50 L1100 100" fill="none" stroke="#00b14f" strokeWidth="2" />
        <path d="M50 550 L100 550 L100 500" fill="none" stroke="#00b14f" strokeWidth="2" />
        <path d="M1150 550 L1100 550 L1100 500" fill="none" stroke="#00b14f" strokeWidth="2" />
      </svg>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Title with decorative lines */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <svg className="w-28 h-4" viewBox="0 0 120 16">
            <line x1="0" y1="8" x2="120" y2="8" stroke="#00b14f" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white ">
            Con số ấn tượng
          </h2>
          
          <svg className="w-28 h-4" viewBox="0 0 120 16">
            <line x1="0" y1="8" x2="120" y2="8" stroke="#00b14f" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
        </div>

        {/* Description */}
        <p className="text-justify text-gray-300 text-sm sm:text-base max-w-5xl mx-auto mb-4 leading-relaxed">
          Freelancer là nền tảng kết nối việc làm hàng đầu Việt Nam. Với năng lực lõi là công nghệ, đặc biệt là trí tuệ nhân tạo (AI), 
          sứ mệnh của Freelancer đặt ra cho mình là thay đổi thị trường tuyển dụng - nhân sự ngày một hiệu quả hơn. Chúng tôi không ngừng đổi mới 
          và phát triển để mang đến trải nghiệm tốt nhất cho cả ứng viên và nhà tuyển dụng trên khắp cả nước.
        </p>

        <p className="text-justify text-gray-300 text-sm sm:text-base max-w-5xl mx-auto mb-12 leading-relaxed">
          Sở hữu hơn 9 triệu người dùng và 200.000+ doanh nghiệp lớn tin dùng, Freelancer khao khát kiến tạo một cầu nối có giá trị vững bền 
          để những nhân tố đủ tâm xứng tầm chạm được nhau: đúng người, đúng thời, đúng hướng. Từ những freelancer tài năng đến các doanh nghiệp 
          đang tìm kiếm nhân sự chất lượng, Freelancer là nơi kết nối và tạo ra những cơ hội nghề nghiệp đột phá.
        </p>

        {/* Top Row - 2 hexagon cards */}
        <div className="flex flex-col md:flex-row justify-center gap-1 mb-6">
          <div className="group relative h-[160px] w-full md:w-[38%] cursor-pointer">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              <polygon className="transition-all duration-500 group-hover:fill-[rgba(0,177,79,0.15)]" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="rgba(0,177,79,0.08)" stroke="#00b14f" strokeWidth="2" strokeOpacity="0.4" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="38,150 15,80 38,10" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="262,10 285,80 262,150" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polygon className="opacity-0 group-hover:opacity-100 hexagon-border-animated" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="none" stroke="#00b14f" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px #00b14f)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-14 py-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats[0].number}</div>
              <div className="text-[#00b14f] text-sm font-semibold italic mt-1">{stats[0].title}</div>
              <p className="text-gray-400 text-xs line-clamp-2 mt-1">{stats[0].desc}</p>
            </div>
          </div>

          <div className="group relative h-[160px] w-full md:w-[38%] cursor-pointer">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              <polygon className="transition-all duration-500 group-hover:fill-[rgba(0,177,79,0.15)]" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="rgba(0,177,79,0.08)" stroke="#00b14f" strokeWidth="2" strokeOpacity="0.4" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="38,150 15,80 38,10" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="262,10 285,80 262,150" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polygon className="opacity-0 group-hover:opacity-100 hexagon-border-animated" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="none" stroke="#00b14f" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px #00b14f)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-14 py-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats[1].number}</div>
              <div className="text-[#00b14f] text-sm font-semibold italic mt-1">{stats[1].title}</div>
              <p className="text-gray-400 text-xs line-clamp-2 mt-1">{stats[1].desc}</p>
            </div>
          </div>
        </div>

        {/* Bottom Row - Hexagon Card | Chip | Hexagon Card */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-0">
          {/* Left Hexagon Card */}
          <div className="group relative h-[160px] w-full md:w-[38%] cursor-pointer md:-mr-2">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              <polygon className="transition-all duration-500 group-hover:fill-[rgba(0,177,79,0.15)]" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="rgba(0,177,79,0.08)" stroke="#00b14f" strokeWidth="2" strokeOpacity="0.4" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="38,150 15,80 38,10" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="262,10 285,80 262,150" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polygon className="opacity-0 group-hover:opacity-100 hexagon-border-animated" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="none" stroke="#00b14f" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px #00b14f)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-14 py-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats[2].number}</div>
              <div className="text-[#00b14f] text-sm font-semibold italic mt-1">{stats[2].title}</div>
              <p className="text-gray-400 text-xs line-clamp-2 mt-1">{stats[2].desc}</p>
            </div>
          </div>

          {/* Center Logo */}
          <div className="flex justify-center items-center z-10">
            <Image
              src="/logo.svg"
              alt="Freelancer Logo"
              width={100}
              height={100}
              className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_0_15px_rgba(0,177,79,0.5)]"
            />
          </div>

          {/* Right Hexagon Card */}
          <div className="group relative h-[160px] w-full md:w-[38%] cursor-pointer md:-ml-2">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              <polygon className="transition-all duration-500 group-hover:fill-[rgba(0,177,79,0.15)]" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="rgba(0,177,79,0.08)" stroke="#00b14f" strokeWidth="2" strokeOpacity="0.4" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="38,150 15,80 38,10" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polyline className="transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_#00b14f)]" points="262,10 285,80 262,150" fill="none" stroke="#00b14f" strokeWidth="3" strokeOpacity="0.9" />
              <polygon className="opacity-0 group-hover:opacity-100 hexagon-border-animated" points="15,80 38,10 262,10 285,80 262,150 38,150" fill="none" stroke="#00b14f" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px #00b14f)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-14 py-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats[3].number}</div>
              <div className="text-[#00b14f] text-sm font-semibold italic mt-1">{stats[3].title}</div>
              <p className="text-gray-400 text-xs line-clamp-2 mt-1">{stats[3].desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
