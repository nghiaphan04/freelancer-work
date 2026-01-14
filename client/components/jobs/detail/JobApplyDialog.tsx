"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";

interface JobApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
  onSubmit: (cvUrl?: string) => void;
  isLoading: boolean;
}

export default function JobApplyDialog({
  open,
  onOpenChange,
  jobTitle,
  coverLetter,
  onCoverLetterChange,
  onSubmit,
  isLoading,
}: JobApplyDialogProps) {
  const [cvUrl, setCvUrl] = useState("");

  const handleSubmit = () => {
    onSubmit(cvUrl || undefined);
  };

  const handleClose = () => {
    if (!isLoading) {
      setCvUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle>Ứng tuyển công việc</DialogTitle>
          <DialogDescription>
            Gửi đơn ứng tuyển cho công việc &quot;{jobTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <FileUpload
            value={cvUrl}
            onChange={(url) => setCvUrl(url)}
            usage="APPLICATION_CV"
            label="CV/Hồ sơ (PDF - không bắt buộc)"
            disabled={isLoading}
          />

          <div>
            <Label htmlFor="coverLetter" className="text-sm text-gray-700">
              Thư giới thiệu (không bắt buộc)
            </Label>
            <Textarea
              id="coverLetter"
              placeholder="Giới thiệu bản thân, kinh nghiệm liên quan và lý do bạn phù hợp với công việc này..."
              value={coverLetter}
              onChange={(e) => onCoverLetterChange(e.target.value)}
              disabled={isLoading}
              className="mt-2 min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#00b14f] hover:bg-[#009643]">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Icon name="send" size={16} />
                Gửi ứng tuyển
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
