"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  jobCategories,
  jobMenuActions,
  findWorkCategories,
  findWorkActions,
  toolsMenu,
  careerMenuLeft,
  careerMenuArticles,
  navItems,
} from "@/constant/layout";

export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileNav, setExpandedMobileNav] = useState<string | null>(null);
  const { user, isAuthenticated, isHydrated, logout } = useAuth();

  return (
    <header className="bg-white text-gray-800 border-b border-gray-200 w-full sticky top-0 z-[9999]">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-start shrink-0">
              <Image
                src="/logo.svg"
                alt="Freelancer"
                width={160}
                height={50}
                className="h-10 w-auto object-contain"
              />
              <p className="text-xs text-gray-500 -mt-0.5">
                Freelancer
              </p>
            </Link>

            {/* Chevron Separator */}
            <div className="hidden md:block h-16 w-12 overflow-hidden">
              <svg 
                className="h-full w-full text-[#00b14f]" 
                viewBox="0 0 40 48" 
                fill="currentColor"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((row) => (
                  [0, 1, 2, 3, 4].map((col) => {
                    const centerY = 24;
                    const distFromCenter = Math.abs(row * 4 - centerY);
                    const x = 32 - col * 5 - distFromCenter * 0.4;
                    const y = 2 + row * 4;
                    const opacity = 0.2 + (col * 0.2);
                    return (
                      <circle 
                        key={`${row}-${col}`} 
                        cx={x} 
                        cy={y} 
                        r="1.5" 
                        opacity={opacity}
                      />
                    );
                  })
                ))}
              </svg>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center">
              {navItems.map((item, index) => (
                <div
                  key={index}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(item.dropdownId)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className="flex items-center gap-0.5 px-1.5 py-4 text-[13px] font-medium transition-colors whitespace-nowrap text-gray-700 hover:text-[#00b14f] group/nav"
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <Icon 
                        name={activeDropdown === item.dropdownId ? "expand_less" : "expand_more"} 
                        size={16} 
                        className="text-gray-400 group-hover/nav:text-[#00b14f]" 
                      />
                    )}
                  </button>

                  {/* Việc làm Dropdown */}
                  {item.dropdownId === "jobs" && activeDropdown === "jobs" && (
                    <div className="absolute top-full left-0 z-[9999] w-[900px]">
                      <div className="bg-white rounded-b-xl shadow-xl border border-gray-200 border-t-2 border-t-[#00b14f] p-6">
                        {/* Grid 4 columns */}
                        <div className="grid grid-cols-4 gap-6">
                          {jobCategories.slice(0, 4).map((category, idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold text-gray-900 mb-3">{category.title}</h4>
                              <ul className="space-y-2">
                                {category.items.map((item, iIdx) => (
                                  <li key={iIdx}>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#00b14f] transition-colors">
                                      {item}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {/* Grid 4 columns - row 2 */}
                        <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
                          {jobCategories.slice(4, 7).map((category, idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold text-gray-900 mb-3">{category.title}</h4>
                              <ul className="space-y-2">
                                {category.items.map((item, iIdx) => (
                                  <li key={iIdx}>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#00b14f] transition-colors">
                                      {item}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          
                          {/* Actions column */}
                          <div className="flex flex-col justify-start gap-3">
                            {jobMenuActions.map((action, aIdx) => (
                              <a
                                key={aIdx}
                                href={action.href}
                                className="inline-flex items-center gap-1 text-sm font-medium text-[#00b14f] hover:underline"
                              >
                                {action.label}
                                <Icon name={action.icon} size={16} />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tìm việc Dropdown */}
                  {item.dropdownId === "find-work" && activeDropdown === "find-work" && (
                    <div className="absolute top-full left-0 z-[9999] w-[900px]">
                      <div className="bg-white rounded-b-xl shadow-xl border border-gray-200 border-t-2 border-t-[#00b14f] p-6">
                        {/* Grid 4 columns - row 1 */}
                        <div className="grid grid-cols-4 gap-6">
                          {findWorkCategories.slice(0, 4).map((category, idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold text-gray-900 mb-3">{category.title}</h4>
                              <ul className="space-y-2">
                                {category.items.map((jobItem, iIdx) => (
                                  <li key={iIdx}>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#00b14f] transition-colors">
                                      {jobItem}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {/* Grid 4 columns - row 2 */}
                        <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
                          {findWorkCategories.slice(4, 7).map((category, idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold text-gray-900 mb-3">{category.title}</h4>
                              <ul className="space-y-2">
                                {category.items.map((jobItem, iIdx) => (
                                  <li key={iIdx}>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#00b14f] transition-colors">
                                      {jobItem}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          
                          {/* Actions column */}
                          <div className="flex flex-col justify-start gap-3">
                            {findWorkActions.map((action, aIdx) => (
                              <a
                                key={aIdx}
                                href={action.href}
                                className="inline-flex items-center gap-1 text-sm font-medium text-[#00b14f] hover:underline"
                              >
                                {action.label}
                                <Icon name={action.icon} size={16} />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Công cụ Dropdown */}
                  {item.dropdownId === "tools" && activeDropdown === "tools" && (
                    <div className="absolute top-full left-0 z-[9999] w-[550px]">
                      <div className="bg-white rounded-b-xl shadow-xl border border-gray-200 border-t-2 border-t-[#00b14f]">
                        <div className="py-4 px-5">
                        <h4 className="text-xs font-semibold text-gray-500 mb-3">
                          {toolsMenu.title}
                        </h4>
                        <div className="space-y-1">
                          {toolsMenu.items.map((row, rIdx) => (
                            <div key={rIdx} className="grid grid-cols-2 gap-x-6">
                              {row.map((tool, tIdx) => (
                                tool ? (
                                  <a
                                    key={tIdx}
                                    href={tool.href}
                                    className="flex items-center gap-3 py-2.5 hover:bg-gray-50 px-2 rounded-lg transition-colors group"
                                  >
                                    <Icon 
                                      name={tool.icon} 
                                      size={20} 
                                      className="text-gray-500 group-hover:text-[#00b14f]" 
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-[#00b14f]">
                                      {tool.label}
                                    </span>
                                  </a>
                                ) : (
                                  <div key={tIdx}></div>
                                )
                              ))}
                            </div>
                          ))}
                        </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cẩm nang nghề nghiệp Dropdown */}
                  {item.dropdownId === "career" && activeDropdown === "career" && (
                    <div className="absolute top-full left-0 z-[9999] w-[750px]">
                      <div className="bg-white rounded-b-xl shadow-xl border border-gray-200 border-t-2 border-t-[#00b14f]">
                        <div className="flex">
                        {/* Left Column - Categories */}
                        <div className="w-[280px] border-r border-gray-100 py-4">
                          {careerMenuLeft.map((menuItem, idx) => (
                            <a
                              key={idx}
                              href={menuItem.href}
                              className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group"
                            >
                              <Icon 
                                name={menuItem.icon} 
                                size={20} 
                                className="text-gray-500 group-hover:text-[#00b14f]" 
                              />
                              <span className="text-sm text-gray-700 group-hover:text-[#00b14f]">
                                {menuItem.label}
                              </span>
                            </a>
                          ))}
                        </div>

                        {/* Right Column - Featured Articles */}
                        <div className="flex-1 py-4 px-5">
                          <h4 className="text-sm font-semibold text-gray-800 mb-4">
                            Bài viết nổi bật
                          </h4>
                          <div className="space-y-4">
                            {careerMenuArticles.map((article, idx) => (
                              <a
                                key={idx}
                                href={article.href}
                                className="flex gap-3 group"
                              >
                                <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-[#e8f5e9] flex items-center justify-center p-2">
                                  <Image 
                                    src={article.image} 
                                    alt={article.title}
                                    width={80}
                                    height={48}
                                    className="object-contain"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-800 group-hover:text-[#00b14f] line-clamp-2 mb-1">
                                    {article.title}
                                  </h5>
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {article.desc}
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                          <a 
                            href="/career" 
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#00b14f] hover:underline"
                          >
                            Xem thêm bài viết nổi bật
                            <Icon name="arrow_forward" size={16} />
                          </a>
                        </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right: Avatar/Buttons + Hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop: Full buttons/avatar */}
            <div className="hidden md:flex items-center gap-1">
              {!isHydrated ? (
                <div className="w-[140px] h-8 bg-gray-100 rounded animate-pulse" />
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors outline-none">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.fullName} />
                        <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                          {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                        {user.fullName}
                      </span>
                      <Icon name="expand_more" size={16} className="text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="border-b border-gray-100 pb-2">
                      <p className="truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-500 font-normal truncate">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <Icon name="person" size={20} />
                        Hồ sơ của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Icon name="settings" size={20} />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={logout}>
                      <Icon name="logout" size={20} />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="flex items-center px-3 py-1.5 text-sm font-semibold text-[#00b14f] border border-[#00b14f] rounded hover:bg-[#00b14f] hover:text-white transition-colors whitespace-nowrap"
                  >
                    Đăng ký
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center px-3 py-1.5 text-sm font-semibold text-white bg-[#00b14f] rounded hover:bg-[#009643] transition-colors whitespace-nowrap"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: Hamburger only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} size={24} className="text-gray-700" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay - Slide from right */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-[9998]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 bg-white w-full max-w-xs overflow-y-auto shadow-xl">
            {/* User info if logged in */}
            {isAuthenticated && user && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.fullName} />
                    <AvatarFallback className="bg-[#00b14f] text-white">
                      {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{user.fullName}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="py-2">
              {navItems.map((item, index) => (
                <div key={index}>
                  <button
                        onClick={() => setExpandedMobileNav(expandedMobileNav === item.dropdownId ? null : item.dropdownId)}
                        className="flex items-center justify-between w-full px-5 py-3.5 text-gray-700 hover:bg-gray-50 hover:text-[#00b14f] transition-colors"
                      >
                        <span className="font-medium">{item.label}</span>
                        <Icon 
                          name={expandedMobileNav === item.dropdownId ? "expand_less" : "expand_more"} 
                          size={20} 
                          className="text-gray-400" 
                        />
                      </button>
                      
                      {/* Việc làm Sub-items */}
                      {item.dropdownId === "jobs" && expandedMobileNav === "jobs" && (
                        <div className="bg-gray-50 py-2 max-h-[60vh] overflow-y-auto">
                          {jobCategories.map((category, cIdx) => (
                            <div key={cIdx} className={cIdx > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}>
                              <p className="px-7 py-1 text-xs font-semibold text-gray-900">{category.title}</p>
                              {category.items.map((jobItem, jIdx) => (
                                <Link
                                  key={jIdx}
                                  href="#"
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block px-7 py-2 text-sm text-gray-600 hover:text-[#00b14f]"
                                >
                                  {jobItem}
                                </Link>
                              ))}
                            </div>
                          ))}
                          <div className="mt-3 pt-3 border-t border-gray-200 px-7">
                            {jobMenuActions.map((action, aIdx) => (
                              <Link
                                key={aIdx}
                                href={action.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-1 py-2 text-sm font-medium text-[#00b14f]"
                              >
                                {action.label}
                                <Icon name={action.icon} size={16} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Công cụ Sub-items */}
                      {item.dropdownId === "tools" && expandedMobileNav === "tools" && (
                        <div className="bg-gray-50 py-2">
                          {toolsMenu.items.flat().filter(Boolean).map((tool, tIdx) => (
                            tool && (
                              <Link
                                key={tIdx}
                                href={tool.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-7 py-2.5 text-sm text-gray-600 hover:text-[#00b14f]"
                              >
                                <Icon name={tool.icon} size={18} className="text-gray-400" />
                                {tool.label}
                              </Link>
                            )
                          ))}
                        </div>
                      )}

                      {/* Cẩm nang Sub-items */}
                      {item.dropdownId === "career" && expandedMobileNav === "career" && (
                        <div className="bg-gray-50 py-2">
                          {careerMenuLeft.map((menuItem, idx) => (
                            <Link
                              key={idx}
                              href={menuItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-7 py-2.5 text-sm text-gray-600 hover:text-[#00b14f]"
                            >
                              <Icon name={menuItem.icon} size={18} className="text-gray-400" />
                              {menuItem.label}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Tìm việc Sub-items */}
                      {item.dropdownId === "find-work" && expandedMobileNav === "find-work" && (
                        <div className="bg-gray-50 py-2 max-h-[60vh] overflow-y-auto">
                          {findWorkCategories.map((category, cIdx) => (
                            <div key={cIdx} className={cIdx > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}>
                              <p className="px-7 py-1 text-xs font-semibold text-gray-900">{category.title}</p>
                              {category.items.map((jobItem, jIdx) => (
                                <Link
                                  key={jIdx}
                                  href="#"
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block px-7 py-2 text-sm text-gray-600 hover:text-[#00b14f]"
                                >
                                  {jobItem}
                                </Link>
                              ))}
                            </div>
                          ))}
                          <div className="mt-3 pt-3 border-t border-gray-200 px-7">
                            {findWorkActions.map((action, aIdx) => (
                              <Link
                                key={aIdx}
                                href={action.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-1 py-2 text-sm font-medium text-[#00b14f]"
                              >
                                {action.label}
                                <Icon name={action.icon} size={16} />
                              </Link>
                            ))}
                          </div>
                        </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="border-t border-gray-200">
              {isAuthenticated && user ? (
                <div className="py-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 hover:text-[#00b14f] transition-colors"
                  >
                    <Icon name="person" size={20} className="text-gray-400" />
                    <span>Hồ sơ của tôi</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 hover:text-[#00b14f] transition-colors"
                  >
                    <Icon name="settings" size={20} className="text-gray-400" />
                    <span>Cài đặt</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-5 py-3.5 text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <Icon name="logout" size={20} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 text-center text-white bg-[#00b14f] rounded-lg font-semibold hover:bg-[#009643] transition-colors mb-3"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 text-center text-[#00b14f] border border-[#00b14f] rounded-lg font-semibold hover:bg-[#00b14f] hover:text-white transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
