"use client";

import { Dispute } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/Icon";
import renderEvidenceCard from "@/components/jobs/dispute/renderEvidenceCard";

interface ViewDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute | null;
}

export default function ViewDisputeDialog({
  open,
  onOpenChange,
  dispute,
}: ViewDisputeDialogProps) {
  if (!dispute) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="gavel" size={20} className="text-gray-500" />
            Chi tiết khiếu nại
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{dispute.jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {dispute.statusLabel}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">
              Khiếu nại từ bên thuê: {dispute.employer.fullName}
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.employerDescription}</p>
            {renderEvidenceCard(dispute.employerEvidenceFile, dispute.employerEvidenceUrl, "Bằng chứng đính kèm")}
          </div>

          {dispute.freelancerDescription ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Phản hồi từ người làm: {dispute.freelancer.fullName}
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.freelancerDescription}</p>
              {renderEvidenceCard(dispute.freelancerEvidenceFile, dispute.freelancerEvidenceUrl, "Bằng chứng đính kèm")}
            </div>
          ) : dispute.freelancerDeadline ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">
                Chờ người làm phản hồi
              </h4>
              <p className="text-sm text-gray-600">
                Hạn: {formatDateTime(dispute.freelancerDeadline)}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Chưa yêu cầu người làm phản hồi
              </p>
            </div>
          )}

          {dispute.adminNote && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">
                Quyết định của quản trị viên
              </h4>
              <p className="text-sm text-gray-600">{dispute.adminNote}</p>
              {dispute.resolvedBy && (
                <p className="text-xs text-gray-500 mt-2">
                  Người xử lý: {dispute.resolvedBy.fullName} - {formatDateTime(dispute.resolvedAt!)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
