"use client";

import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import SystemTermsDisplay from "@/components/jobs/forms/post-job/sections/SystemTermsDisplay";

interface ContractTerm {
  title: string;
  content: string;
}

interface ContractData {
  budget: number;
  currency: string;
  deadlineDays: number;
  reviewDays: number;
  requirements?: string;
  deliverables?: string;
  terms?: ContractTerm[];
  contractHash: string;
}

interface SignContractDialogProps {
  open: boolean;
  onClose: () => void;
  jobTitle?: string;
  contractData: ContractData | null;
  isLoading: boolean;
  onSign: () => void;
}

const PLATFORM_FEE_PERCENT = 5;

export default function SignContractDialog({
  open,
  onClose,
  jobTitle,
  contractData,
  isLoading,
  onSign,
}: SignContractDialogProps) {
  const { isConnected, connect, isConnecting } = useWallet();
  const { user } = useAuth();

  const validTerms = contractData?.terms?.filter(t => t.title?.trim() || t.content?.trim()) || [];
  const jobTermsCount = 1 + (contractData?.deliverables ? 1 : 0) + validTerms.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onClose()}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="description" size={20} />
            Ký hợp đồng công việc
          </DialogTitle>
          <DialogDescription>{jobTitle}</DialogDescription>
        </DialogHeader>

        {contractData ? (
          <div className="space-y-4 py-2">
            {/* Wallet Status */}
            {!isConnected && (
              <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="account_balance_wallet" size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Cần kết nối ví để ký hợp đồng
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={connect}
                    disabled={isConnecting}
                    className="bg-[#00b14f] hover:bg-[#009643]"
                  >
                    {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                  </Button>
                </div>
              </div>
            )}

            {/* Contract Document */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="px-5 py-4 border-b border-gray-200 text-center">
                <h2 className="text-sm font-bold uppercase text-gray-800">Hợp đồng công việc</h2>
                <p className="text-xs text-gray-500 mt-1">Xác thực trên Blockchain Aptos</p>
              </div>
              
              <div className="px-5 py-4 max-h-96 overflow-y-auto text-sm leading-relaxed scrollbar-thin">
                {/* Thông tin các bên */}
                <div className="mb-6 space-y-3">
                  <p className="text-center font-semibold text-gray-800 uppercase text-xs tracking-wide">
                    Thông tin các bên trong hợp đồng
                  </p>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-semibold">Bên A – Bên thuê</p>
                    <p className="text-xs text-gray-600">
                      (Là tài khoản đã đăng công việc và nạp tiền ký quỹ trên nền tảng)
                    </p>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-semibold">
                      Bên B – Người làm
                      {user?.fullName ? `: ${user.fullName}` : ""}
                    </p>
                    {user?.walletAddress && (
                      <p>Địa chỉ ví: {user.walletAddress}</p>
                    )}
                  </div>
                  <p className="text-justify text-gray-700">
                    Hợp đồng này là căn cứ để hệ thống tự động xử lý thanh toán, phạt và tranh chấp cho công việc nói trên theo các điều
                    khoản tại Phần A (Điều khoản công việc) và Phần B (Quy định hệ thống) dưới đây.
                  </p>
                </div>

                {/* PHẦN A - ĐIỀU KHOẢN CÔNG VIỆC */}
                <div className="mb-6">
                  <h4 className="font-bold text-center text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    PHẦN A - ĐIỀU KHOẢN CÔNG VIỆC
                  </h4>
                  
                  {/* Thời hạn thực hiện */}
                  <div className="mb-3">
                    <p className="text-justify">
                      <span className="font-semibold">Điều 1. Thời hạn thực hiện</span>
                      {": "}
                      <span className="text-gray-700">
                        Bên B cam kết hoàn thành và bàn giao sản phẩm trong thời hạn {contractData.deadlineDays} ngày kể từ ngày ký hợp đồng. 
                        Bên A có trách nhiệm nghiệm thu sản phẩm trong thời hạn {contractData.reviewDays} ngày kể từ ngày nhận bàn giao.
                      </span>
                    </p>
                  </div>

                  {/* Sản phẩm bàn giao */}
                  {contractData.deliverables && (
                    <div className="mb-3">
                      <p className="text-justify">
                        <span className="font-semibold">Điều 2. Sản phẩm bàn giao</span>
                        {": "}
                        <span className="text-gray-700 whitespace-pre-line">
                          Bên B cam kết bàn giao cho Bên A các sản phẩm sau:
                          {"\n"}{contractData.deliverables}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Custom Terms */}
                  {validTerms.map((term, index) => (
                    <div key={index} className="mb-3">
                      <p className="font-semibold text-gray-900">
                        Điều {(contractData.deliverables ? 2 : 1) + index + 1}. {term.title}
                      </p>
                      <div
                        className="text-gray-700 prose prose-sm max-w-none mt-1"
                        dangerouslySetInnerHTML={{ __html: term.content }}
                      />
                    </div>
                  ))}
                </div>

                {/* PHẦN B - QUY ĐỊNH HỆ THỐNG */}
                <div>
                  <h4 className="font-bold text-center text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    PHẦN B - QUY ĐỊNH HỆ THỐNG
                  </h4>
                  <p className="text-xs text-gray-500 italic mb-3 text-center">
                    (Được quy định bởi Smart Contract trên blockchain Aptos - Không thể thay đổi)
                  </p>
                  <SystemTermsDisplay
                    budget={contractData.budget}
                    submissionDays={contractData.deadlineDays}
                    reviewDays={contractData.reviewDays}
                    platformFeePercent={PLATFORM_FEE_PERCENT}
                    startIndex={jobTermsCount}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Đang tải hợp đồng...</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={onSign}
            disabled={isLoading || !contractData || !isConnected}
            className="bg-[#00b14f] hover:bg-[#009643]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang ký...
              </>
            ) : (
              <>
                <Icon name="draw" size={16} />
                Ký hợp đồng
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
