"use client";

import { FacebookIcon, YouTubeIcon } from "@/components/ui/SocialIcons";
import Icon from "@/components/ui/Icon";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 mt-auto">
      {/* Section 1: Main Footer */}
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Cột trái: Logo, App, Social */}
            <div className="lg:col-span-3 space-y-6">
              {/* Logo */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Freelancer</h3>
                <p className="text-sm text-gray-400">Nền tảng kết nối freelancer quản lý xây dựng và khách hàng hàng đầu Việt Nam</p>
              </div>

              {/* Ứng dụng tải xuống */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Tải ứng dụng</h4>
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
                <h4 className="text-sm font-semibold text-white mb-3">Theo dõi chúng tôi</h4>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-gray-400 hover:text-[#1877F2] transition-colors">
                    <FacebookIcon size={24} />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-[#FF0000] transition-colors">
                    <YouTubeIcon size={24} />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-[#0A66C2] transition-colors">
                    <Icon name="work" size={24} />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                    <Icon name="tag" size={24} />
                  </a>
                </div>
              </div>
            </div>

            {/* Các cột link bên phải */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                
                {/* Cột 1: Dành cho khách hàng */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">Dành cho bên thuê</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Cách thuê freelancer</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Đăng công việc</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tìm kỹ sư QS</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Thuê Shopdrawing</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Lập dự toán</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Lập tiến độ</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tư vấn kỹ thuật</a></li>
                  </ul>
                </div>

                {/* Cột 2: Dành cho Freelancer */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">Dành cho người làm</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Cách tìm việc</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tìm việc remote</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Quản lý hợp đồng</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Xây dựng hồ sơ năng lực</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Chứng chỉ hành nghề</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Hướng dẫn tranh chấp</a></li>
                  </ul>

                  <h4 className="text-sm font-semibold text-white mb-4 mt-6">Tài nguyên</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Trung tâm trợ giúp</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Blog & Tin tức</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Cộng đồng kỹ sư</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tiêu chuẩn kỹ thuật</a></li>
                  </ul>
                </div>

                {/* Cột 3: Danh mục phổ biến */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">Loại công việc</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Bóc tách khối lượng (QS)</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Lập dự toán</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Shopdrawing</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Lập tiến độ thi công</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">BIM Modeling</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Thiết kế kết cấu</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tư vấn giám sát</a></li>
                  </ul>
                </div>

                {/* Cột 4: Về chúng tôi */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">Về nền tảng</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Về chúng tôi</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Cơ chế bảo vệ</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Giải quyết tranh chấp</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tuyển dụng</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Liên hệ</a></li>
                  </ul>

                  <h4 className="text-sm font-semibold text-white mb-4 mt-6">Pháp lý</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Điều khoản dịch vụ</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Chính sách bảo mật</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Quy định hợp đồng</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-[#00b14f] transition-colors">Tiêu chuẩn kỹ thuật</a></li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              © 2025 Freelancer Vietnam. Đã đăng ký bản quyền.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <a href="#" className="hover:text-[#00b14f] transition-colors">Điều khoản</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00b14f] transition-colors">Bảo mật</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00b14f] transition-colors">Cookie</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00b14f] transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
