"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, JobApplication } from "@/lib/api";
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

// ============ FREELANCER: Submit Work Dialog ============
interface WorkSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  onSuccess?: () => void;
}

export function WorkSubmitDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: WorkSubmitDialogProps) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error("Vui lòng nhập link sản phẩm");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitWork(jobId, { url, note });
      if (response.status === "SUCCESS") {
        toast.success("Đã nộp sản phẩm thành công! Chờ employer duyệt.");
        setUrl("");
        setNote("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi nộp sản phẩm");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="upload_file" size={20} className="text-[#00b14f]" />
            Nộp sản phẩm
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/... hoặc https://github.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload sản phẩm lên Google Drive, GitHub, Figma,... và dán link ở đây
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mô tả những gì đã hoàn thành, hướng dẫn sử dụng..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f]"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">📋 Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Employer sẽ có 3 ngày để duyệt sản phẩm</li>
              <li>Nếu không duyệt, hệ thống sẽ tự động thanh toán cho bạn</li>
              <li>Cả hai sẽ được +1 điểm uy tín khi hoàn thành</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-[#00b14f] hover:bg-[#009643]"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp sản phẩm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ EMPLOYER: Review Work Dialog ============
interface WorkReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  onSuccess?: () => void;
}

export function WorkReviewDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: WorkReviewDialogProps) {
  const [workSubmission, setWorkSubmission] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWorkSubmission();
    }
  }, [open, jobId]);

  const fetchWorkSubmission = async () => {
    setIsLoading(true);
    try {
      const response = await api.getWorkSubmission(jobId);
      if (response.status === "SUCCESS") {
        setWorkSubmission(response.data);
      }
    } catch (error) {
      console.error("Error fetching work submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const response = await api.approveWork(jobId);
      if (response.status === "SUCCESS") {
        toast.success("Đã duyệt sản phẩm và thanh toán cho freelancer!");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi duyệt sản phẩm");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast.error("Vui lòng nhập yêu cầu chỉnh sửa");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.requestRevision(jobId, revisionNote);
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi yêu cầu chỉnh sửa cho freelancer!");
        setRevisionNote("");
        setShowRevisionForm(false);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="rate_review" size={20} className="text-blue-600" />
            Duyệt sản phẩm
          </DialogTitle>
          <DialogDescription>
            Công việc: <strong>{jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-4 border-[#00b14f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : !workSubmission?.workSubmissionUrl ? (
          <div className="py-8 text-center">
            <Icon name="hourglass_empty" size={48} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Freelancer chưa nộp sản phẩm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Work Submission Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="person" size={18} className="text-gray-500" />
                <span className="font-medium">{workSubmission.freelancer.fullName}</span>
                <span className="text-xs text-gray-500">
                  • Nộp lúc {formatDateTime(workSubmission.workSubmittedAt!)}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Link sản phẩm:</p>
                  <a
                    href={workSubmission.workSubmissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all flex items-center gap-1"
                  >
                    <Icon name="link" size={16} />
                    {workSubmission.workSubmissionUrl}
                  </a>
                </div>

                {workSubmission.workSubmissionNote && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ghi chú:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {workSubmission.workSubmissionNote}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Revision History */}
            {workSubmission.workRevisionNote && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Yêu cầu chỉnh sửa trước đó:</strong> {workSubmission.workRevisionNote}
                </p>
              </div>
            )}

            {/* Revision Form */}
            {showRevisionForm ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu chỉnh sửa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="Mô tả những gì cần chỉnh sửa..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRevisionForm(false);
                      setRevisionNote("");
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRequestRevision}
                    disabled={isProcessing}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isProcessing ? "Đang gửi..." : "Gửi yêu cầu"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
                <p className="font-medium mb-1">✅ Khi duyệt sản phẩm:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tiền escrow sẽ được chuyển cho freelancer</li>
                  <li>Cả hai sẽ được +1 điểm uy tín</li>
                  <li>Công việc sẽ hoàn thành</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {workSubmission?.workSubmissionUrl && !showRevisionForm && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRevisionForm(true)}
                disabled={isProcessing}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Icon name="edit_note" size={16} />
                Yêu cầu chỉnh sửa
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={isProcessing}
                className="bg-[#00b14f] hover:bg-[#009643]"
              >
                {isProcessing ? "Đang xử lý..." : (
                  <>
                    <Icon name="check_circle" size={16} />
                    Duyệt & Thanh toán
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
