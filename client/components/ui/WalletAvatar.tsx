"use client";

import { useMemo } from "react";
import makeBlockie from "ethereum-blockies-base64";
import { cn } from "@/lib/utils";

interface WalletAvatarProps {
  address: string;
  size?: number;
  className?: string;
}

export default function WalletAvatar({ address, size = 32, className }: WalletAvatarProps) {
  const blockie = useMemo(() => {
    if (!address) return null;
    try {
      return makeBlockie(address.toLowerCase());
    } catch {
      return null;
    }
  }, [address]);

  if (!blockie) {
    return (
      <div
        className={cn("rounded-full bg-gradient-to-br from-[#00b14f] to-[#009643]", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={blockie}
      alt="Wallet Avatar"
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
