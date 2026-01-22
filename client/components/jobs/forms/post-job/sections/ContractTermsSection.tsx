"use client";

import Icon from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ContractTerm } from "@/hooks/useContractTerms";

interface ContractTermsSectionProps {
  terms: ContractTerm[];
  onAddTerm: () => void;
  onUpdateTerm: (index: number, field: "title" | "content", value: string) => void;
  onRemoveTerm: (index: number) => void;
  disabled?: boolean;
}

export default function ContractTermsSection({
  terms,
  onAddTerm,
  onUpdateTerm,
  onRemoveTerm,
  disabled,
}: ContractTermsSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          <Icon name="description" size={20} className="inline mr-2 text-[#00b14f]" />
          Điều khoản hợp đồng
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddTerm}
          className="text-[#00b14f] border-[#00b14f] hover:bg-[#00b14f]/10"
        >
          <Icon name="add" size={16} />
          Thêm điều khoản
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Tự tạo các điều khoản hợp đồng. Nội dung sẽ được hash và lưu trên blockchain, freelancer phải đọc và ký xác nhận.
      </p>

      <div className="space-y-6">
        {terms.map((term, index) => (
          <div key={index} className={index > 0 ? "pt-4 border-t border-gray-100" : ""}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Điều {index + 1}.</span>
              <Input
                value={term.title}
                onChange={(e) => onUpdateTerm(index, "title", e.target.value)}
                placeholder="Tên điều khoản..."
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => onRemoveTerm(index)}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Xóa"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
            <Textarea
              value={term.content}
              onChange={(e) => onUpdateTerm(index, "content", e.target.value)}
              placeholder="Nội dung điều khoản..."
              rows={2}
            />
          </div>
        ))}

        {terms.length === 0 && (
          <p className="text-center py-4 text-gray-400 text-sm">
            Chưa có điều khoản. Nhấn "Thêm điều khoản" để bắt đầu.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        <Icon name="info" size={14} className="inline mr-1" />
        Tất cả các điều khoản sẽ được hash và lưu trên blockchain khi tạo escrow
      </p>
    </div>
  );
}
