"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, JobApplication } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
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
import { FileUpload } from "@/components/ui/file-upload";

interface WorkSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  escrowId?: number;
  onSuccess?: () => void;
}

export function WorkSubmitDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  escrowId,
  onSuccess,
}: WorkSubmitDialogProps) {
  const { isConnected, nopSanPham, getAptosExplorerUrl } = useWallet();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("Sản phẩm đã hoàn thành theo yêu cầu.\n\nBao gồm:\n- Source code hoàn chỉnh\n- Tài liệu hướng dẫn cài đặt\n- File thiết kế gốc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileId, setFileId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setNote("Sản phẩm đã hoàn thành theo yêu cầu.\n\nBao gồm:\n- Source code hoàn chỉnh\n- Tài liệu hướng dẫn cài đặt\n- File thiết kế gốc");
      setFileId(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error("Vui lòng upload file sản phẩm");
      return;
    }

    setIsSubmitting(true);
    try {
      let txHash: string | undefined;
      
      if (escrowId && isConnected) {
        const result = await nopSanPham(escrowId, url);
        if (!result) {
          throw new Error("Không thể nộp sản phẩm");
        }
        txHash = result;
      }

      const payload: { url: string; note?: string; fileId?: number; txHash?: string } = { url };
      if (note.trim()) payload.note = note;
      if (fileId !== null) payload.fileId = fileId;
      if (txHash) payload.txHash = txHash;
      
      const response = await api.submitWork(jobId, payload);
      if (response.status === "SUCCESS") {
        toast.success("Đã nộp sản phẩm thành công! Chờ bên thuê duyệt.");
        setUrl("");
        setNote("");
        setFileId(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi nộp sản phẩm");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent 
        className="max-w-lg"
        onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
      >
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
          <FileUpload
            value={url}
            onChange={(uploadedUrl, _file, uploadedFileId) => {
              setUrl(uploadedUrl);
              setFileId(uploadedFileId ?? null);
            }}
            usage="WORK_SUBMISSION"
            label="File sản phẩm (PDF)"
            required
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mô tả những gì đã hoàn thành, hướng dẫn sử dụng..."
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b14f] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-1 flex items-center gap-1">
              <Icon name="info" size={16} />
              Lưu ý:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-5">
              <li>Bên thuê sẽ có thời gian để duyệt sản phẩm</li>
              <li>Nếu không duyệt, hệ thống sẽ tự động thanh toán cho bạn</li>
              <li>Thanh toán được thực hiện qua smart contract</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !url.trim()}
            className="bg-[#00b14f] hover:bg-[#009643]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang nộp...
              </>
            ) : "Nộp sản phẩm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WorkReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  jobTitle: string;
  escrowId?: number;
  budget?: number;
  currency?: string;
  onSuccess?: () => void;
}

export function WorkReviewDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  escrowId,
  budget,
  currency = "APT",
  onSuccess,
}: WorkReviewDialogProps) {
  const { isConnected, address, traTienNguoiLam, yeuCauChinhSua, connect, isConnecting, getAptosExplorerUrl } = useWallet();
  const [workSubmission, setWorkSubmission] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [revisionNote, setRevisionNote] = useState("Vui lòng chỉnh sửa các điểm sau:\n\n1. Bổ sung chức năng export PDF\n2. Sửa lỗi hiển thị trên mobile\n3. Cập nhật màu sắc theo brand guideline");
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
    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để duyệt và thanh toán");
        return;
      }
    }

    if (!escrowId) {
      toast.error("Không thể thực hiện thao tác");
      return;
    }

    setIsProcessing(true);
    try {
      const txHash = await traTienNguoiLam(escrowId);
      
      if (!txHash) {
        throw new Error("Không thể duyệt sản phẩm");
      }

      const response = await api.approveWork(jobId, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Đã duyệt sản phẩm thành công!");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error approving work:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi duyệt sản phẩm");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast.error("Vui lòng nhập yêu cầu chỉnh sửa");
      return;
    }

    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        toast.error("Vui lòng kết nối ví để yêu cầu chỉnh sửa");
        return;
      }
    }

    if (!escrowId) {
      toast.error("Không thể thực hiện thao tác");
      return;
    }

    setIsProcessing(true);
    try {
      const txHash = await yeuCauChinhSua(escrowId);
      
      if (!txHash) {
        throw new Error("Không thể gửi yêu cầu chỉnh sửa");
      }

      const response = await api.requestRevision(jobId, revisionNote, txHash);
      if (response.status === "SUCCESS") {
        toast.success("Đã gửi yêu cầu chỉnh sửa cho người làm!");
        setRevisionNote("");
        setShowRevisionForm(false);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error requesting revision:", error);
      if (error.message?.includes("User rejected")) {
        toast.error("Bạn đã hủy thao tác");
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi yêu cầu chỉnh sửa");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isProcessing && onOpenChange(open)}>
      <DialogContent 
        className="max-w-lg"
        onPointerDownOutside={(e) => isProcessing && e.preventDefault()}
        onEscapeKeyDown={(e) => isProcessing && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="rate_review" size={20} className="text-gray-600" />
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
            <p className="text-gray-500">Người làm chưa nộp sản phẩm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wallet Status */}
            <div className={`p-3 rounded-lg border ${isConnected ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon 
                    name={isConnected ? "check_circle" : "account_balance_wallet"} 
                    size={18} 
                    className={isConnected ? "text-green-600" : "text-amber-600"} 
                  />
                  <span className={`text-sm font-medium ${isConnected ? "text-green-800" : "text-amber-800"}`}>
                    {isConnected 
                      ? `Ví: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                      : "Cần kết nối ví để thanh toán"
                    }
                  </span>
                </div>
                {!isConnected && (
                  <Button
                    size="sm"
                    onClick={connect}
                    disabled={isConnecting}
                    className="bg-[#00b14f] hover:bg-[#009643]"
                  >
                    {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="person" size={18} className="text-gray-500" />
                <span className="font-medium">{workSubmission.freelancer.fullName}</span>
                <span className="text-xs text-gray-500">
                  • Nộp lúc {formatDateTime(workSubmission.workSubmittedAt!)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-2">File sản phẩm:</p>
                  <a
                    href={workSubmission.workSubmissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-[#00b14f]/5 hover:bg-[#00b14f]/10 transition-colors"
                  >
                    <Icon name="picture_as_pdf" size={20} className="text-red-500 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">Sản phẩm đã nộp</span>
                    <Icon name="download" size={18} className="text-gray-500 shrink-0" />
                  </a>
                </div>

                {workSubmission.workSubmissionNote && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ghi chú từ người làm:</p>
                    <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                      {workSubmission.workSubmissionNote}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {workSubmission.workRevisionNote && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Yêu cầu chỉnh sửa trước đó:</strong> {workSubmission.workRevisionNote}
                </p>
              </div>
            )}

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
                    disabled={isProcessing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
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
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Đang gửi...
                      </>
                    ) : "Gửi yêu cầu"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-700">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <Icon name="info" size={16} />
                  Khi duyệt sản phẩm:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-5">
                  <li>Số tiền <strong>{budget?.toFixed(4)} {currency}</strong> sẽ được chuyển cho freelancer qua blockchain</li>
                  <li>Cả hai bên sẽ được +1 điểm uy tín</li>
                  <li>Công việc sẽ được đánh dấu hoàn thành</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Đóng
          </Button>
          {workSubmission?.workSubmissionUrl && !showRevisionForm && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRevisionForm(true)}
                disabled={isProcessing}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <Icon name="edit_note" size={16} />
                Yêu cầu chỉnh sửa
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={isProcessing || !isConnected}
                className="bg-[#00b14f] hover:bg-[#009643]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
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
