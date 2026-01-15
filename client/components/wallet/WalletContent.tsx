"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { User } from "@/types/user";
import { BalanceDeposit } from "@/types/balance";
import { Page } from "@/types/job";
import Icon from "@/components/ui/Icon";
import BalanceCards from "./BalanceCards";
import DepositForm from "./DepositForm";
import CreditPackages from "./CreditPackages";
import DepositHistory from "./DepositHistory";

interface WalletContentProps {
  user: User;
}

export default function WalletContent({ user }: WalletContentProps) {
  const [balance, setBalance] = useState(user.balance || 0);
  const [credits, setCredits] = useState(user.credits || 0);
  const [deposits, setDeposits] = useState<BalanceDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyDeposits({ page: 0, size: 10 });
      if (res.status === "SUCCESS" && res.data) {
        setDeposits((res.data as Page<BalanceDeposit>).content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00b14f] mb-4">
          <Icon name="arrow_back" size={20} />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Ví của tôi</h1>
        <p className="text-gray-500 mt-1">Quản lý số dư và credit</p>
      </div>

      <BalanceCards balance={balance} credits={credits} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <DepositForm 
          onSuccess={(amt) => setBalance((b) => b + amt)} 
          onRefresh={fetchDeposits} 
          disabled={isProcessing}
          setProcessing={setIsProcessing}
        />
        <CreditPackages 
          balance={balance} 
          onPurchase={(price, c) => { setBalance((b) => b - price); setCredits((cr) => cr + c); }} 
          disabled={isProcessing}
          setProcessing={setIsProcessing}
        />
      </div>
      <DepositHistory deposits={deposits} isLoading={isLoading} />
    </div>
  );
}
