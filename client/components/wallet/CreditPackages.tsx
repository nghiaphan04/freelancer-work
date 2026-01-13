"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, CreditPackage } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CreditPackagesProps {
  balance: number;
  onPurchase: (price: number, credits: number) => void;
  disabled?: boolean;
  setProcessing?: (v: boolean) => void;
}

export default function CreditPackages({ balance, onPurchase, disabled, setProcessing }: CreditPackagesProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selected, setSelected] = useState<CreditPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api.getCreditPackages().then((res) => {
      if (res.status === "SUCCESS" && res.data) setPackages(res.data);
    });
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val || 0);

  const handlePurchase = async () => {
    if (!selected) return;
    if (balance < selected.price) {
      toast.error("Số dư không đủ");
      setShowConfirm(false);
      return;
    }
    setIsLoading(true);
    setProcessing?.(true);
    try {
      const res = await api.purchaseCredits(selected.packageId);
      if (res.status === "SUCCESS") {
        toast.success(`Mua thành công ${selected.credits} credit!`);
        onPurchase(selected.price, selected.credits);
        setShowConfirm(false);
        setSelected(null);
      } else {
        toast.error(res.message || "Không thể mua credit");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
      setProcessing?.(false);
    }
  };

  const isDisabled = disabled || isLoading;

  if (packages.length === 0) return <div className="bg-white rounded-lg shadow p-6" />;

  return (
    <>
      <div className={`bg-white rounded-lg shadow p-6 ${isDisabled ? "opacity-60" : ""}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mua Credit</h2>
        <p className="text-sm text-gray-500 mb-3">Dùng để ứng tuyển công việc (1 credit/lần)</p>
        <fieldset disabled={isDisabled}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packages.map((pkg) => (
              <div
                key={pkg.packageId}
                onClick={() => !isDisabled && setSelected(pkg)}
                className={`border rounded-lg p-4 transition-colors ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} ${
                  selected?.packageId === pkg.packageId ? "border-[#00b14f] bg-[#00b14f]/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl font-bold text-gray-900">{pkg.credits}</span>
                  {pkg.discountPercent > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">-{pkg.discountPercent}%</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">credit</p>
                <p className="font-medium text-[#00b14f]">{formatCurrency(pkg.price)}</p>
              </div>
            ))}
          </div>
          {selected && (
            <Button onClick={() => setShowConfirm(true)} disabled={isDisabled} className="w-full mt-4 bg-[#00b14f] hover:bg-[#009643]">
              Mua {selected.credits} credit
            </Button>
          )}
        </fieldset>
      </div>

      <Dialog 
        open={showConfirm} 
        onOpenChange={(open) => {
          if (!isLoading) setShowConfirm(open);
        }}
      >
        <DialogContent showCloseButton={!isLoading}>
          <DialogHeader>
            <DialogTitle>Xác nhận mua credit</DialogTitle>
            <DialogDescription>
              Số dư sẽ được trừ ngay sau khi xác nhận.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gói</span>
                <span>{selected.credits} credit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Giá</span>
                <span className="text-[#00b14f] font-medium">{formatCurrency(selected.price)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Số dư sau mua</span>
                <span>{formatCurrency(balance - selected.price)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="bg-[#00b14f] hover:bg-[#009643]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang mua...
                </>
              ) : (
                <>
                  <Icon name="shopping_cart" size={16} />
                  Mua credit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
