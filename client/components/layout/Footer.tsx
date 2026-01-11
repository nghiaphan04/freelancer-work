"use client";

import { FacebookIcon, YouTubeIcon } from "@/components/ui/SocialIcons";

export default function Footer() {
  return (
    <footer className="bg-white text-gray-800 mt-auto border-t border-gray-200">
      {/* Section 1: Main Footer */}
      <div className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Cột trái: Logo, Liên hệ, App, Social */}
            <div className="lg:col-span-3 space-y-6">

              {/* Ứng dụng tải xuống */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Ứng dụng tải xuống</h4>
                <div className="flex gap-2">
                  <a href="#" className="block">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                      alt="App Store" 
                      className="h-10"
                    />
                  </a>
                  <a href="#" className="block">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                      alt="Google Play" 
                      className="h-10"
                    />
                  </a>
                </div>
              </div>

              {/* Cộng đồng */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Cộng đồng Freelancer</h4>
                <div className="flex items-center gap-3">
                  <a href="#" className="text-gray-600 hover:text-[#1877F2] transition-colors">
                    <FacebookIcon size={28} />
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#FF0000] transition-colors">
                    <YouTubeIcon size={28} />
                  </a>
                </div>
              </div>
            </div>

            {/* Các cột link bên phải */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                
                {/* Cột 1: Về Freelancer */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Về Freelancer</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Giới thiệu</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Góc báo chí</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Tuyển dụng</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Liên hệ</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Hỏi đáp</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Chính sách bảo mật</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Điều khoản dịch vụ</a></li>
                  </ul>
                </div>

                {/* Cột 2: Hồ sơ và CV */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Hồ sơ và CV</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Quản lý CV của bạn</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Hướng dẫn viết CV</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Thư viện CV theo ngành</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Review CV</a></li>
                  </ul>

                  <h4 className="text-sm font-bold text-gray-900 mb-4 mt-6">Khám phá</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Ứng dụng di động</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Tính lương Gross - Net</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Trắc nghiệm MBTI</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Trắc nghiệm MI</a></li>
                  </ul>
                </div>

                {/* Cột 3: Xây dựng sự nghiệp */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Xây dựng sự nghiệp</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm tốt nhất</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm lương cao</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm quản lý</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm IT</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm Senior</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm bán thời gian</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Việc làm Remote</a></li>
                  </ul>
                </div>

                {/* Cột 4: Đối tác & Quy tắc */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Đối tác</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">TestCenter</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">TopHR</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">ViecNgay</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Happy Time</a></li>
                  </ul>

                  <h4 className="text-sm font-bold text-gray-900 mb-4 mt-6">Quy tắc chung</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Điều kiện giao dịch</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Giá dịch vụ & Thanh toán</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-[#00b14f] transition-colors">Thông tin vận chuyển</a></li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs text-gray-500">
            Copyright © 2025 Freelancer Vietnam. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
