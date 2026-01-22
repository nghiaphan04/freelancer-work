"use client";

import { toast } from "sonner";
import Icon from "@/components/ui/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WalletButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  onConnect: () => Promise<boolean>;
  onDisconnect: () => void;
}

const formatAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function WalletButton({
  isConnected,
  isConnecting,
  address,
  onConnect,
  onDisconnect,
}: WalletButtonProps) {
  const handleConnect = async () => {
    const success = await onConnect();
    if (!success) {
      toast.info("Vui lòng cài đặt Petra Wallet để kết nối");
    }
  };

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#00b14f] text-white rounded hover:bg-[#009643] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            <span className="font-mono">{formatAddress(address || "")}</span>
            <Icon name="expand_more" size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="border-b border-gray-100 pb-2">
            <p className="text-xs text-gray-500">Địa chỉ ví</p>
            <p className="font-mono text-sm truncate">{formatAddress(address || "")}</p>
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(address || "").then(() => toast.success("Đã sao chép địa chỉ"))}>
            <Icon name="content_copy" size={18} />
            Sao chép địa chỉ
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`https://explorer.aptoslabs.com/account/${address}?network=testnet`} target="_blank" rel="noopener noreferrer">
              <Icon name="open_in_new" size={18} />
              Xem trên Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDisconnect}>
            <Icon name="link_off" size={18} />
            Ngắt kết nối ví
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[#00b14f] text-[#00b14f] rounded hover:bg-[#00b14f] hover:text-white transition-colors disabled:opacity-50"
    >
      {isConnecting ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      )}
      <span>{isConnecting ? "Đang kết nối..." : "Kết nối ví"}</span>
    </button>
  );
}
