"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import Icon from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WalletAvatar from "@/components/ui/WalletAvatar";
import { navItems, toolsMenu, careerMenuLeft } from "@/constant/layout";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; fullName: string; email: string; avatarUrl?: string; roles?: string[] } | null;
  isAuthenticated: boolean;
  isWalletConnected: boolean;
  isWalletConnecting: boolean;
  walletAddress: string | null;
  walletBalance: number;
  unreadMessagesCount: number;
  isBecomingEmployer: boolean;
  onConnectWallet: () => Promise<boolean>;
  onDisconnectWallet: () => void;
  onBecomeEmployer: () => Promise<void>;
  onLogout: () => void;
}

const formatAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function MobileMenu({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  isWalletConnected,
  isWalletConnecting,
  walletAddress,
  walletBalance,
  unreadMessagesCount,
  isBecomingEmployer,
  onConnectWallet,
  onDisconnectWallet,
  onBecomeEmployer,
  onLogout,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [expandedNav, setExpandedNav] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (prefix: string) => pathname?.startsWith(prefix);

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[9999] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 bg-white sticky top-0">
        <Link href="/" onClick={onClose} className="flex flex-col items-start shrink-0">
          <Image src="/logo.svg" alt="Freelancer" width={140} height={44} className="h-9 w-auto object-contain" />
          <p className="text-xs text-gray-500 -mt-0.5">Freelancer</p>
        </Link>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Icon name="close" size={24} className="text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-64px)]">
        {/* Wallet Section */}
        {isAuthenticated && (
          <div className="p-4 border-b border-gray-200">
            {isWalletConnected ? (
              <div className="flex items-center justify-between p-3 bg-[#00b14f]/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00b14f] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{walletBalance.toFixed(2)} APT</p>
                    <p className="text-xs text-gray-500 font-mono">{formatAddress(walletAddress || "")}</p>
                  </div>
                </div>
                <button onClick={onDisconnectWallet} className="p-2 text-gray-400 hover:text-red-500">
                  <Icon name="link_off" size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  const success = await onConnectWallet();
                  if (!success) toast.info("Vui lòng cài đặt Petra Wallet để kết nối");
                }}
                disabled={isWalletConnecting}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-[#00b14f] text-white rounded-lg hover:bg-[#009643] transition-colors disabled:opacity-50"
              >
                {isWalletConnecting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                )}
                <span>{isWalletConnecting ? "Đang kết nối..." : "Kết nối ví Aptos"}</span>
              </button>
            )}
          </div>
        )}

        {/* User Info */}
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

        {/* Navigation */}
        <nav className="py-2">
          {navItems.map((item, index) => (
            <div key={index}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between w-full px-5 py-3.5 transition-colors ${
                    item.href === "/" ? (isActive(item.href) ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50")
                    : (isActive(item.href) || isActivePrefix(item.href)) ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <Icon name="chevron_right" size={20} className="text-gray-400" />
                </Link>
              ) : item.dropdownId && (
                <button
                  onClick={() => setExpandedNav(expandedNav === item.dropdownId ? null : item.dropdownId!)}
                  className="flex items-center justify-between w-full px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{item.label}</span>
                  <Icon name={expandedNav === item.dropdownId ? "expand_less" : "expand_more"} size={20} className="text-gray-400" />
                </button>
              )}
              
              {item.dropdownId === "tools" && expandedNav === "tools" && (
                <div className="bg-gray-50 py-2">
                  {toolsMenu.items.flat().filter(Boolean).map((tool, tIdx) => (
                    tool && (
                      <Link key={tIdx} href={tool.href} onClick={onClose} className="flex items-center gap-3 px-7 py-2.5 text-sm text-gray-600 hover:text-[#00b14f]">
                        <Icon name={tool.icon} size={18} className="text-gray-400" />
                        {tool.label}
                      </Link>
                    )
                  ))}
                </div>
              )}

              {item.dropdownId === "career" && expandedNav === "career" && (
                <div className="bg-gray-50 py-2">
                  {careerMenuLeft.map((menuItem, idx) => (
                    <Link key={idx} href={menuItem.href} onClick={onClose} className="flex items-center gap-3 px-7 py-2.5 text-sm text-gray-600 hover:text-[#00b14f]">
                      <Icon name={menuItem.icon} size={18} className="text-gray-400" />
                      {menuItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Actions */}
        <div className="border-t border-gray-200">
          {isAuthenticated && user ? (
            <div className="py-2">
              <Link href="/profile" onClick={onClose} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isActive("/profile") ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50"}`}>
                <Icon name="person" size={20} className={isActive("/profile") ? "text-[#00b14f]" : "text-gray-400"} />
                <span>Hồ sơ của tôi</span>
              </Link>
              <Link href="/messages" onClick={onClose} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isActivePrefix("/messages") ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50"}`}>
                <Icon name="chat" size={20} className={isActivePrefix("/messages") ? "text-[#00b14f]" : "text-gray-400"} />
                <span className="flex-1">Tin nhắn</span>
                {unreadMessagesCount > 0 && (
                  <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </Link>
              {user.roles?.includes("ROLE_FREELANCER") && (
                <Link href="/my-accepted-jobs" onClick={onClose} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isActivePrefix("/my-accepted-jobs") ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50"}`}>
                  <Icon name="work" size={20} className={isActivePrefix("/my-accepted-jobs") ? "text-[#00b14f]" : "text-gray-400"} />
                  <span>Quản lý các hợp đồng</span>
                </Link>
              )}
              {user.roles?.includes("ROLE_EMPLOYER") ? (
                <Link href="/my-posted-jobs" onClick={onClose} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isActivePrefix("/my-posted-jobs") ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50"}`}>
                  <Icon name="post_add" size={20} className={isActivePrefix("/my-posted-jobs") ? "text-[#00b14f]" : "text-gray-400"} />
                  <span>Việc đã đăng</span>
                </Link>
              ) : (
                <button onClick={async () => { await onBecomeEmployer(); onClose(); }} disabled={isBecomingEmployer} className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 w-full disabled:opacity-50">
                  {isBecomingEmployer ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Icon name="add_business" size={20} className="text-gray-400" />}
                  <span>{isBecomingEmployer ? "Đang xử lý..." : "Đăng ký trở thành bên thuê"}</span>
                </button>
              )}
              <Link href="/settings" onClick={onClose} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isActive("/settings") ? "bg-[#00b14f]/5 text-[#00b14f]" : "text-gray-700 hover:bg-gray-50"}`}>
                <Icon name="settings" size={20} className={isActive("/settings") ? "text-[#00b14f]" : "text-gray-400"} />
                <span>Cài đặt</span>
              </Link>
              <button onClick={() => { onLogout(); onClose(); }} className="flex items-center gap-3 px-5 py-3.5 text-red-500 hover:bg-red-50 w-full">
                <Icon name="logout" size={20} />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="p-4">
              <Link href="/login" onClick={onClose} className="block w-full py-3 text-center text-white bg-[#00b14f] rounded-lg font-semibold hover:bg-[#009643] mb-3">
                Đăng nhập
              </Link>
              <Link href="/register" onClick={onClose} className="block w-full py-3 text-center text-[#00b14f] border border-[#00b14f] rounded-lg font-semibold hover:bg-[#00b14f] hover:text-white">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
