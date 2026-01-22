"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WalletAvatar from "@/components/ui/WalletAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  toolsMenu,
  careerMenuLeft,
  careerMenuArticles,
  navItems,
} from "@/constant/layout";
import NotificationDropdown from "./NotificationDropdown";

export default function Header() {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileNav, setExpandedMobileNav] = useState<string | null>(null);
  const [isBecomingEmployer, setIsBecomingEmployer] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const { user, isAuthenticated, isHydrated, logout, loginWithWallet } = useAuth();
  const { isConnected: isWalletConnected, address: walletAddress, publicKey, isConnecting: isWalletConnecting, connect: connectWallet, signMessage } = useWallet();
  const { becomeEmployer } = useProfile();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [inputName, setInputName] = useState("");
  const pendingSignDataRef = useRef<{ signature: string; fullMessage: string } | null>(null);

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Fetch unread messages count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getChatCounts();
      if (res.status === "SUCCESS") {
        setUnreadMessagesCount(res.data.unreadMessages);
      }
    } catch (error) {
      console.error("Failed to fetch unread messages count:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Check if current path matches
  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (prefix: string) => pathname?.startsWith(prefix);

  const handleBecomeEmployer = async () => {
    setIsBecomingEmployer(true);
    const success = await becomeEmployer();
    setIsBecomingEmployer(false);
    if (success) {
      toast.success("Đăng ký thành công! Bạn có thể đăng việc.");
      setActiveDropdown(null);
    } else {
      toast.error("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  const [pendingWalletLogin, setPendingWalletLogin] = useState(false);

  useEffect(() => {
    const performWalletLogin = async () => {
      if (!pendingWalletLogin || !isWalletConnected || !walletAddress || !publicKey || isAuthenticated) {
        return;
      }

      setIsLoggingIn(true);
      setPendingWalletLogin(false);

      try {
        const message = `Đăng nhập vào Freelancer\nTimestamp: ${Date.now()}`;
        const signResult = await signMessage(message);
        
        if (!signResult) {
          toast.error("Không thể ký xác thực. Vui lòng thử lại.");
          setIsLoggingIn(false);
          return;
        }

        const result = await loginWithWallet(
          walletAddress,
          publicKey,
          signResult.signature,
          signResult.fullMessage
        );

        if (result.success) {
          toast.success("Đăng nhập thành công!");
        } else if (result.needName) {
          pendingSignDataRef.current = signResult;
          setShowNameDialog(true);
        } else {
          toast.error(result.error || "Đăng nhập thất bại");
        }
      } catch (error) {
        console.error("Wallet login error:", error);
        toast.error("Có lỗi xảy ra khi đăng nhập");
      } finally {
        setIsLoggingIn(false);
      }
    };

    performWalletLogin();
  }, [pendingWalletLogin, isWalletConnected, walletAddress, publicKey, isAuthenticated, signMessage, loginWithWallet]);

  const handleNameSubmit = async () => {
    if (!inputName.trim() || !walletAddress || !publicKey || !pendingSignDataRef.current) {
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await loginWithWallet(
        walletAddress,
        publicKey,
        pendingSignDataRef.current.signature,
        pendingSignDataRef.current.fullMessage,
        inputName.trim()
      );

      if (result.success) {
        toast.success("Đăng ký và đăng nhập thành công!");
        setShowNameDialog(false);
        setInputName("");
        pendingSignDataRef.current = null;
      } else {
        toast.error(result.error || "Đăng ký thất bại");
      }
    } catch (error) {
      console.error("Name submit error:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleWalletLogin = async () => {
    if (isWalletConnected && walletAddress && publicKey) {
      setPendingWalletLogin(true);
    } else {
      const connected = await connectWallet();
      if (!connected) {
        toast.info("Vui lòng cài đặt Petra Wallet để kết nối");
        return;
      }
      setPendingWalletLogin(true);
    }
  };

  return (
    <>
      {/* Spacer for fixed header on desktop */}
      <div className="hidden md:block h-16" />
      <header className="bg-white text-gray-800 border-b border-gray-200 w-full md:fixed md:top-0 md:left-0 md:right-0 z-40">
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
                  onMouseEnter={() => item.hasDropdown && item.dropdownId && setActiveDropdown(item.dropdownId)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-0.5 px-1.5 py-4 text-[13px] font-medium transition-colors whitespace-nowrap group/nav ${
                        item.href === "/" 
                          ? isActive(item.href) 
                            ? "text-[#00b14f]" 
                            : "text-gray-700 hover:text-[#00b14f]"
                          : (isActive(item.href) || isActivePrefix(item.href))
                            ? "text-[#00b14f]"
                            : "text-gray-700 hover:text-[#00b14f]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      className={`flex items-center gap-0.5 px-1.5 py-4 text-[13px] font-medium transition-colors whitespace-nowrap group/nav ${
                        item.dropdownId === "career" && (isActivePrefix("/blog") || isActivePrefix("/career"))
                          ? "text-[#00b14f]"
                          : "text-gray-700 hover:text-[#00b14f]"
                      }`}
                    >
                      {item.label}
                      {item.hasDropdown && (
                        <Icon 
                          name={activeDropdown === item.dropdownId ? "expand_less" : "expand_more"} 
                          size={16} 
                          className={`group-hover/nav:text-[#00b14f] ${
                            item.dropdownId === "career" && (isActivePrefix("/blog") || isActivePrefix("/career"))
                              ? "text-[#00b14f]"
                              : "text-gray-400"
                          }`}
                        />
                      )}
                    </button>
                  )}

                  {/* Công cụ Dropdown */}
                  {item.dropdownId === "tools" && activeDropdown === "tools" && (
                    <div className="absolute top-full left-0 z-40 w-[550px]">
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
                    <div className="absolute top-full left-0 z-40 w-[750px]">
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
                          <Link 
                            href="/blog" 
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#00b14f] hover:underline"
                          >
                            Xem thêm bài viết nổi bật
                            <Icon name="arrow_forward" size={16} />
                          </Link>
                        </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Quản lý công việc - chỉ hiện khi có role */}
              {isAuthenticated && (user?.roles?.includes("ROLE_FREELANCER") || user?.roles?.includes("ROLE_EMPLOYER")) && (
                <div
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown("my-jobs")}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className={`flex items-center gap-0.5 px-1.5 py-4 text-[13px] font-medium transition-colors whitespace-nowrap group/nav ${
                    isActivePrefix("/my-posted-jobs") || isActivePrefix("/my-accepted-jobs")
                      ? "text-[#00b14f]"
                      : "text-gray-700 hover:text-[#00b14f]"
                  }`}>
                    Quản lý công việc
                    <Icon 
                      name={activeDropdown === "my-jobs" ? "expand_less" : "expand_more"} 
                      size={16} 
                      className={isActivePrefix("/my-posted-jobs") || isActivePrefix("/my-accepted-jobs") ? "text-[#00b14f]" : "text-gray-400 group-hover/nav:text-[#00b14f]"}
                    />
                  </button>
                  {activeDropdown === "my-jobs" && (
                    <div className="absolute top-full left-0 z-40 w-[280px]">
                      <div className="bg-white rounded-b-xl shadow-xl border border-gray-200 border-t-2 border-t-[#00b14f] py-2">
                        {user?.roles?.includes("ROLE_FREELANCER") && (
                          <Link 
                            href="/my-accepted-jobs" 
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${
                              isActivePrefix("/my-accepted-jobs") ? "bg-[#00b14f]/5" : "hover:bg-gray-50"
                            }`}
                          >
                            <Icon name="work" size={20} className={isActivePrefix("/my-accepted-jobs") ? "text-[#00b14f]" : "text-gray-500 group-hover:text-[#00b14f]"} />
                            <span className={`text-sm ${isActivePrefix("/my-accepted-jobs") ? "text-[#00b14f] font-medium" : "text-gray-700 group-hover:text-[#00b14f]"}`}>Việc đã nhận</span>
                          </Link>
                        )}
                        {user?.roles?.includes("ROLE_EMPLOYER") ? (
                          <Link 
                            href="/my-posted-jobs" 
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${
                              isActivePrefix("/my-posted-jobs") ? "bg-[#00b14f]/5" : "hover:bg-gray-50"
                            }`}
                          >
                            <Icon name="post_add" size={20} className={isActivePrefix("/my-posted-jobs") ? "text-[#00b14f]" : "text-gray-500 group-hover:text-[#00b14f]"} />
                            <span className={`text-sm ${isActivePrefix("/my-posted-jobs") ? "text-[#00b14f] font-medium" : "text-gray-700 group-hover:text-[#00b14f]"}`}>Việc đã đăng</span>
                          </Link>
                        ) : (
                          <button 
                            onClick={handleBecomeEmployer}
                            disabled={isBecomingEmployer}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBecomingEmployer ? (
                              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Icon name="add_business" size={20} className="text-gray-500 group-hover:text-[#00b14f]" />
                            )}
                            <span className="text-sm text-gray-700 group-hover:text-[#00b14f]">
                              {isBecomingEmployer ? "Đang xử lý..." : "Đăng ký trở thành bên thuê"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Right: Avatar/Buttons + Hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop: Full buttons/avatar */}
            <div className="hidden md:flex items-center gap-1">
              {!isHydrated ? (
                <div className="w-[140px] h-8 bg-gray-100 rounded animate-pulse" />
              ) : isAuthenticated && user ? (
                <>
                  {/* Messenger */}
                  <Link
                    href="/messages"
                    className="relative p-2"
                  >
                    <Icon 
                      name="forum" 
                      size={22} 
                      className={`hover:text-[#00b14f] transition-colors ${isActivePrefix("/messages") ? "text-[#00b14f]" : "text-gray-600"}`}
                    />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </span>
                    )}
                  </Link>

                  {/* Notification Bell */}
                  <NotificationDropdown />

                  {/* User Menu */}
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors outline-none">
                      {user.avatarUrl ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                          <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                            {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : walletAddress ? (
                        <WalletAvatar address={walletAddress} size={32} />
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#00b14f] text-white text-sm">
                            {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                        {user.fullName}
                      </span>
                      <Icon name="expand_more" size={16} className="text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="border-b border-gray-100 pb-2">
                      <p className="truncate">{user.fullName}</p>
                      {user.email && <p className="text-xs text-gray-500 font-normal truncate">{user.email}</p>}
                    </DropdownMenuLabel>
                    {isWalletConnected && walletAddress && (
                      <>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(walletAddress).then(() => toast.success("Đã sao chép địa chỉ"))}>
                          <Icon name="content_copy" size={18} />
                          Sao chép địa chỉ ví
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`} target="_blank" rel="noopener noreferrer">
                            <Icon name="open_in_new" size={18} />
                            Xem trên Explorer
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild className={isActive("/profile") ? "bg-[#00b14f]/5 text-[#00b14f]" : ""}>
                      <Link href="/profile">
                        <Icon name="person" size={20} />
                        Hồ sơ của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className={isActive("/settings") ? "bg-[#00b14f]/5 text-[#00b14f]" : ""}>
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
                </>
              ) : (
                <button
                  onClick={handleWalletLogin}
                  disabled={isLoggingIn || isWalletConnecting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#00b14f] rounded hover:bg-[#009643] transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {isLoggingIn || isWalletConnecting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                  )}
                  <span>{isLoggingIn ? "Đang đăng nhập..." : "Kết nối ví"}</span>
                </button>
              )}
            </div>

            {/* Mobile: Messenger + Notification + Hamburger */}
            <div className="flex md:hidden items-center gap-1">
              {isAuthenticated && user && (
                <>
                  <Link
                    href="/messages"
                    className="relative p-2"
                  >
                    <Icon 
                      name="forum" 
                      size={22} 
                      className={isActivePrefix("/messages") ? "text-[#00b14f]" : "text-gray-600"} 
                    />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  <NotificationDropdown />
                </>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                <Icon name={mobileMenuOpen ? "close" : "menu"} size={24} className="text-gray-700 hover:text-[#00b14f] transition-colors" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay - Full screen */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 bg-white sticky top-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-start shrink-0">
              <Image
                src="/logo.svg"
                alt="Freelancer"
                width={140}
                height={44}
                className="h-9 w-auto object-contain"
              />
              <p className="text-xs text-gray-500 -mt-0.5">Freelancer</p>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon name="close" size={24} className="text-gray-700" />
            </button>
          </div>

          {/* Mobile Menu Content - scrollable */}
          <div className="overflow-y-auto h-[calc(100vh-64px)]">
            {/* User info if logged in */}
            {isAuthenticated && user && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                      <AvatarFallback className="bg-[#00b14f] text-white">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : walletAddress ? (
                    <WalletAvatar address={walletAddress} size={48} />
                  ) : (
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-[#00b14f] text-white">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{user.fullName}</p>
                    {user.email && <p className="text-sm text-gray-500 truncate">{user.email}</p>}
                  </div>
                </div>
              </div>
            )}

            <nav className="py-2">
              {navItems.map((item, index) => (
                <div key={index}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between w-full px-5 py-3.5 transition-colors ${
                        item.href === "/"
                          ? isActive(item.href)
                            ? "bg-[#00b14f]/5 text-[#00b14f]"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                          : (isActive(item.href) || isActivePrefix(item.href))
                            ? "bg-[#00b14f]/5 text-[#00b14f]"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      <Icon name="chevron_right" size={20} className="text-gray-400" />
                    </Link>
                  ) : item.dropdownId ? (
                    <button
                      onClick={() => setExpandedMobileNav(expandedMobileNav === item.dropdownId ? null : item.dropdownId!)}
                      className="flex items-center justify-between w-full px-5 py-3.5 text-gray-700 hover:bg-gray-50 hover:text-[#00b14f] transition-colors"
                    >
                      <span className="font-medium">{item.label}</span>
                      <Icon 
                        name={expandedMobileNav === item.dropdownId ? "expand_less" : "expand_more"} 
                        size={20} 
                        className="text-gray-400" 
                      />
                    </button>
                  ) : null}
                      
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

                </div>
              ))}
            </nav>

            <div className="border-t border-gray-200">
              {isAuthenticated && user ? (
                <div className="py-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      isActive("/profile") 
                        ? "bg-[#00b14f]/5 text-[#00b14f]" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                    }`}
                  >
                    <Icon name="person" size={20} className={isActive("/profile") ? "text-[#00b14f]" : "text-gray-400"} />
                    <span>Hồ sơ của tôi</span>
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      isActivePrefix("/messages") 
                        ? "bg-[#00b14f]/5 text-[#00b14f]" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                    }`}
                  >
                    <Icon name="chat" size={20} className={isActivePrefix("/messages") ? "text-[#00b14f]" : "text-gray-400"} />
                    <span className="flex-1">Tin nhắn</span>
                    {unreadMessagesCount > 0 && (
                      <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      isActive("/notifications") 
                        ? "bg-[#00b14f]/5 text-[#00b14f]" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                    }`}
                  >
                    <Icon name="notifications" size={20} className={isActive("/notifications") ? "text-[#00b14f]" : "text-gray-400"} />
                    <span>Thông báo</span>
                  </Link>
                  {user.roles?.includes("ROLE_FREELANCER") && (
                    <Link
                      href="/my-accepted-jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                        isActivePrefix("/my-accepted-jobs") 
                          ? "bg-[#00b14f]/5 text-[#00b14f]" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                      }`}
                    >
                      <Icon name="work" size={20} className={isActivePrefix("/my-accepted-jobs") ? "text-[#00b14f]" : "text-gray-400"} />
                      <span>Việc đã nhận</span>
                    </Link>
                  )}
                  {user.roles?.includes("ROLE_EMPLOYER") ? (
                    <Link
                      href="/my-posted-jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                        isActivePrefix("/my-posted-jobs") 
                          ? "bg-[#00b14f]/5 text-[#00b14f]" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                      }`}
                    >
                      <Icon name="post_add" size={20} className={isActivePrefix("/my-posted-jobs") ? "text-[#00b14f]" : "text-gray-400"} />
                      <span>Việc đã đăng</span>
                    </Link>
                  ) : (
                    <button
                      onClick={async () => { await handleBecomeEmployer(); setMobileMenuOpen(false); }}
                      disabled={isBecomingEmployer}
                      className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 hover:text-[#00b14f] transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBecomingEmployer ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="add_business" size={20} className="text-gray-400" />
                      )}
                      <span>{isBecomingEmployer ? "Đang xử lý..." : "Đăng ký trở thành bên thuê"}</span>
                    </button>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      isActive("/settings") 
                        ? "bg-[#00b14f]/5 text-[#00b14f]" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#00b14f]"
                    }`}
                  >
                    <Icon name="settings" size={20} className={isActive("/settings") ? "text-[#00b14f]" : "text-gray-400"} />
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
                  <button
                    onClick={async () => {
                      await handleWalletLogin();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isLoggingIn || isWalletConnecting}
                    className="flex items-center justify-center gap-2 w-full py-3 text-white bg-[#00b14f] rounded-lg font-semibold hover:bg-[#009643] transition-colors disabled:opacity-50"
                  >
                    {isLoggingIn || isWalletConnecting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                      </svg>
                    )}
                    <span>{isLoggingIn ? "Đang đăng nhập..." : "Kết nối ví Aptos"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Name Input Dialog for new wallet users */}
    <Dialog open={showNameDialog} onOpenChange={(open) => {
      if (!open) {
        setShowNameDialog(false);
        setInputName("");
        pendingSignDataRef.current = null;
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chào mừng bạn đến với Freelancer!</DialogTitle>
          <DialogDescription>
            Vui lòng nhập tên của bạn để hoàn tất đăng ký tài khoản.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Họ và tên
            </label>
            <Input
              id="fullName"
              placeholder="Nhập họ và tên của bạn"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputName.trim()) {
                  handleNameSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <Button
            onClick={handleNameSubmit}
            disabled={!inputName.trim() || isLoggingIn}
            className="w-full bg-[#00b14f] hover:bg-[#009643]"
          >
            {isLoggingIn ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {isLoggingIn ? "Đang xử lý..." : "Hoàn tất đăng ký"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
