"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

type TabType = "job-seeker" | "employer";

const jobSeekerContent = {
  headline: "Tìm việc khó",
  highlightText: "đã có Freelancer",
  phone: "(024) 7107 6480",
  email: "hotro@freelancer.vn",
  emailLabel: "Email hỗ trợ Bên tìm việc:",
};

const employerContent = {
  cskh: {
    title: "CSKH & Khiếu nại dịch vụ",
    hotlines: [
      { phone: "(024) 7107 9799", label: "Hotline 1" },
      { phone: "0862 69 19 29", label: "Hotline 2" },
    ],
    email: "cskh@freelancer.vn",
    emailLabel: "Email hỗ trợ Nhà tuyển dụng",
  },
  mienBac: {
    title: "Hotline Tư vấn Tuyển dụng miền Bắc",
    contacts: [
      { phone: "0964 746 015", name: "Phạm Nhật Huy" },
      { phone: "0365 359 573", name: "Lê Thị Hiền" },
      { phone: "0977 568 186", name: "Bùi Anh Sơn" },
      { phone: "0866 441 382", name: "Nguyễn Bích Phương" },
      { phone: "0948 851 294", name: "Đỗ Phương Hà" },
    ],
  },
  mienNam: {
    title: "Hotline Tư vấn Tuyển dụng miền Nam",
    contacts: [
      { phone: "0932 448 007", name: "Trần Thị Như Trang" },
      { phone: "0767 574 637", name: "Võ Thị Danh Phương" },
      { phone: "0982 818 575", name: "Phạm Thị Mỹ Huyền" },
      { phone: "0778 630 336", name: "Đoàn Thị Cẩm Sen" },
      { phone: "0352 518 558", name: "Trương Thị Mỹ Linh" },
    ],
  },
};

export default function HotlineSupport() {
  const [activeTab, setActiveTab] = useState<TabType>("employer");

  return (
    <section className="relative bg-gradient-to-br from-[#0d3d2e] via-[#0a4a37] to-[#063d2d] py-12 overflow-hidden">
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

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Hotline Tư Vấn
        </h2>

        {/* Full width Card with Tabs */}
        <div className="w-full">
          {/* Mobile Tabs - Simple rounded buttons */}
          <div className="flex gap-2 mb-0 sm:hidden">
            <button
              onClick={() => setActiveTab("job-seeker")}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                activeTab === "job-seeker"
                  ? "bg-white text-[#00b14f]"
                  : "bg-[#00b14f] text-white"
              }`}
            >
              Bên tìm việc
            </button>
            <button
              onClick={() => setActiveTab("employer")}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                activeTab === "employer"
                  ? "bg-white text-[#00b14f]"
                  : "bg-[#00b14f] text-white"
              }`}
            >
              Bên thuê
            </button>
          </div>

          {/* Desktop Tabs - Trapezoid style */}
          <div className="hidden sm:flex">
            <div
              onClick={() => setActiveTab("job-seeker")}
              className={`relative px-8 py-4 text-base font-semibold transition-all cursor-pointer ${
                activeTab === "job-seeker"
                  ? "text-[#00b14f] z-10"
                  : "text-white hover:opacity-90"
              }`}
              style={{ marginRight: "-10px" }}
            >
              {/* Background SVG for trapezoid with rounded corners */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 50"
                preserveAspectRatio="none"
              >
                <path
                  d="M12 0 H175 Q188 0 188 12 L200 50 H0 V12 Q0 0 12 0"
                  fill={activeTab === "job-seeker" ? "white" : "#00b14f"}
                  className="transition-all"
                />
              </svg>
              <span className="relative z-10">Dành cho Bên tìm việc</span>
            </div>
            <div
              onClick={() => setActiveTab("employer")}
              className={`relative px-8 py-4 text-base font-semibold transition-all cursor-pointer ${
                activeTab === "employer"
                  ? "text-[#00b14f] z-10"
                  : "text-white hover:opacity-90"
              }`}
            >
              {/* Background SVG for trapezoid with rounded corners */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 50"
                preserveAspectRatio="none"
              >
                <path
                  d="M12 0 H175 Q188 0 188 12 L200 50 H0 V12 Q0 0 12 0"
                  fill={activeTab === "employer" ? "white" : "#00b14f"}
                  className="transition-all"
                />
              </svg>
              <span className="relative z-10">Dành cho Bên thuê</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-b-lg sm:rounded-tr-lg p-5 sm:p-8 md:p-10 shadow-xl">
            {activeTab === "job-seeker" ? (
              /* Job Seeker Content */
              <div>
                <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-8">
                  {jobSeekerContent.headline}{" "}
                  <span className="text-[#00b14f]">{jobSeekerContent.highlightText}</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
                  <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-2 border-[#00b14f] rounded-full">
                    <Icon name="phone" size={24} className="text-[#00b14f] sm:w-7 sm:h-7" />
                    <span className="text-lg sm:text-2xl font-bold text-gray-800">{jobSeekerContent.phone}</span>
                  </div>
                  <a
                    href={`tel:${jobSeekerContent.phone.replace(/[^0-9]/g, "")}`}
                    className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#00b14f] hover:bg-[#009643] text-white text-base sm:text-lg font-semibold rounded-full transition-colors"
                  >
                    <Icon name="phone_in_talk" size={20} className="sm:w-6 sm:h-6" />
                    GỌI NGAY
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-lg">
                  <span>{jobSeekerContent.emailLabel}</span>
                  <a
                    href={`mailto:${jobSeekerContent.email}`}
                    className="flex items-center gap-2 text-[#00b14f] font-medium hover:underline"
                  >
                    <Icon name="mail" size={18} className="sm:w-5 sm:h-5" />
                    {jobSeekerContent.email}
                  </a>
                </div>
              </div>
            ) : (
              /* Employer Content - 3 columns */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Column 1: CSKH */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-3 md:mb-4 text-sm md:text-base">{employerContent.cskh.title}</h4>
                  <div className="space-y-2 md:space-y-3">
                    {employerContent.cskh.hotlines.map((item, idx) => (
                      <a
                        key={idx}
                        href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                        className="flex items-center gap-2 md:gap-3 text-gray-700 hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="phone" size={16} className="text-[#00b14f] md:w-[18px] md:h-[18px]" />
                        <span className="text-[#00b14f] font-semibold text-sm md:text-base">{item.phone}</span>
                        <span className="text-gray-500 text-xs md:text-sm">· {item.label}</span>
                      </a>
                    ))}
                  </div>
                  <div className="mt-4 md:mt-6">
                    <p className="text-gray-600 mb-2 text-xs md:text-sm">{employerContent.cskh.emailLabel}</p>
                    <a
                      href={`mailto:${employerContent.cskh.email}`}
                      className="flex items-center gap-2 text-[#00b14f] font-medium hover:underline text-sm md:text-base"
                    >
                      <Icon name="mail" size={16} className="md:w-[18px] md:h-[18px]" />
                      {employerContent.cskh.email}
                    </a>
                  </div>
                </div>

                {/* Column 2: Miền Bắc */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-3 md:mb-4 text-sm md:text-base">{employerContent.mienBac.title}</h4>
                  <div className="space-y-2 md:space-y-3">
                    {employerContent.mienBac.contacts.map((item, idx) => (
                      <a
                        key={idx}
                        href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                        className="flex items-center gap-2 md:gap-3 text-gray-700 hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="phone" size={16} className="text-[#00b14f] md:w-[18px] md:h-[18px]" />
                        <span className="text-[#00b14f] font-semibold text-sm md:text-base">{item.phone}</span>
                        <span className="text-gray-500 text-xs md:text-sm">· {item.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 3: Miền Nam */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-3 md:mb-4 text-sm md:text-base">{employerContent.mienNam.title}</h4>
                  <div className="space-y-2 md:space-y-3">
                    {employerContent.mienNam.contacts.map((item, idx) => (
                      <a
                        key={idx}
                        href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                        className="flex items-center gap-2 md:gap-3 text-gray-700 hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="phone" size={16} className="text-[#00b14f] md:w-[18px] md:h-[18px]" />
                        <span className="text-[#00b14f] font-semibold text-sm md:text-base">{item.phone}</span>
                        <span className="text-gray-500 text-xs md:text-sm">· {item.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
