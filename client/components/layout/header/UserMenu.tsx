"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
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

interface UserMenuProps {
  user: {
    id: number;
    fullName: string;
    email?: string;
    avatarUrl?: string;
    walletAddress?: string;
  };
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
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
          ) : user.walletAddress ? (
            <WalletAvatar address={user.walletAddress} size={32} />
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
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="border-b border-gray-100 pb-2">
          <p className="truncate">{user.fullName}</p>
          {user.email && <p className="text-xs text-gray-500 font-normal truncate">{user.email}</p>}
        </DropdownMenuLabel>
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
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <Icon name="logout" size={20} />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
