"use client";

import { useState } from "react";
import Image from "next/image";
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
    <section className="relative py-12 overflow-hidden">
      {/* Background Image */}
      <Image
        src="/landing/banner.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 italic">
          Hotline Tư Vấn
        </h2>

        {/* Full width Card with Tabs */}
        <div className="w-full">
          {/* Trapezoid Tabs */}
          <div className="flex">
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
          <div className="bg-white rounded-b-lg rounded-tr-lg p-8 md:p-10 shadow-xl">
            {activeTab === "job-seeker" ? (
              /* Job Seeker Content */
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
                  {jobSeekerContent.headline}{" "}
                  <span className="text-[#00b14f]">{jobSeekerContent.highlightText}</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4 px-6 py-4 border-2 border-[#00b14f] rounded-full">
                    <Icon name="phone" size={28} className="text-[#00b14f]" />
                    <span className="text-2xl font-bold text-gray-800">{jobSeekerContent.phone}</span>
                  </div>
                  <a
                    href={`tel:${jobSeekerContent.phone.replace(/[^0-9]/g, "")}`}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-[#00b14f] hover:bg-[#009643] text-white text-lg font-semibold rounded-full transition-colors"
                  >
                    <Icon name="phone_in_talk" size={24} />
                    GỌI NGAY
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-600 text-lg">
                  <span>{jobSeekerContent.emailLabel}</span>
                  <a
                    href={`mailto:${jobSeekerContent.email}`}
                    className="flex items-center gap-2 text-[#00b14f] font-medium hover:underline"
                  >
                    <Icon name="mail" size={20} />
                    {jobSeekerContent.email}
                  </a>
                </div>
              </div>
            ) : (
              /* Employer Content - 3 columns */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Column 1: CSKH */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-4">{employerContent.cskh.title}</h4>
                  <div className="space-y-3">
                    {employerContent.cskh.hotlines.map((item, idx) => (
                      <a
                        key={idx}
                        href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                        className="flex items-center gap-3 text-gray-700 hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="phone" size={18} className="text-[#00b14f]" />
                        <span className="text-[#00b14f] font-semibold">{item.phone}</span>
                        <span className="text-gray-500">· {item.label}</span>
                      </a>
                    ))}
                  </div>
                  <div className="mt-6">
                    <p className="text-gray-600 mb-2">{employerContent.cskh.emailLabel}</p>
                    <a
                      href={`mailto:${employerContent.cskh.email}`}
                      className="flex items-center gap-2 text-[#00b14f] font-medium hover:underline"
                    >
                      <Icon name="mail" size={18} />
                      {employerContent.cskh.email}
                    </a>
                  </div>
                </div>

                {/* Column 2: Miền Bắc */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-4">{employerContent.mienBac.title}</h4>
                  <div className="space-y-3">
                    {employerContent.mienBac.contacts.map((item, idx) => (
                      <a
                        key={idx}
                        href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                        className="flex items-center gap-3 text-gray-700 hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="phone" size={18} className="text-[#00b14f]" />
                        <span className="text-[#00b14f] font-semibold">{item.phone}</span>
                        <span className="text-gray-500">· {item.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 3: Miền Nam */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-4">{employerContent.mienNam.title}</h4>
                  <div className="space-y-3">
                    {employerContent.mienNam.contacts.map((item, idx) => (
                      <a
                        key={idx}
                        href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                        className="flex items-center gap-3 text-gray-700 hover:text-[#00b14f] transition-colors"
                      >
                        <Icon name="phone" size={18} className="text-[#00b14f]" />
                        <span className="text-[#00b14f] font-semibold">{item.phone}</span>
                        <span className="text-gray-500">· {item.name}</span>
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
