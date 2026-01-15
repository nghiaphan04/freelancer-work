package com.workhub.api.dto.response;

import com.workhub.api.entity.EJobHistoryAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class JobHistoryResponse {
    private Long id;
    private Long jobId;
    private EJobHistoryAction action;
    private String actionLabel;
    private String description;
    private String metadata;
    private UserInfo user;
    private FileAttachment fileAttachment;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private String role;
    }

    @Data
    @Builder
    public static class FileAttachment {
        private Long id;
        private String secureUrl;
        private String originalFilename;
        private String readableSize;
    }

    public static String getActionLabel(EJobHistoryAction action) {
        return switch (action) {
            case JOB_CREATED -> "Tạo công việc";
            case JOB_UPDATED -> "Cập nhật công việc";
            case JOB_SUBMITTED -> "Gửi duyệt";
            case JOB_OPENED -> "Mở tuyển dụng";
            case JOB_CLOSED -> "Đóng tuyển dụng";
            case APPLICATION_ACCEPTED -> "Duyệt ứng viên";
            case APPLICATION_REJECTED -> "Từ chối ứng viên";
            case WORK_APPROVED -> "Duyệt công việc";
            case WORK_REJECTED -> "Yêu cầu chỉnh sửa";
            case PAYMENT_RELEASED -> "Thanh toán";
            case APPLICATION_SUBMITTED -> "Nộp đơn ứng tuyển";
            case APPLICATION_WITHDRAWN -> "Rút đơn ứng tuyển";
            case WORK_STARTED -> "Bắt đầu làm việc";
            case WORK_SUBMITTED -> "Nộp sản phẩm";
            case WORK_REVISED -> "Nộp lại sau chỉnh sửa";
            case JOB_APPROVED -> "Admin duyệt";
            case JOB_REJECTED -> "Admin từ chối";
            case JOB_COMPLETED -> "Hoàn thành";
            case JOB_CANCELLED -> "Đã hủy";
            case WITHDRAWAL_REQUESTED -> "Yêu cầu rút/hủy";
            case WITHDRAWAL_APPROVED -> "Chấp nhận yêu cầu";
            case WITHDRAWAL_REJECTED -> "Từ chối yêu cầu";
            case WITHDRAWAL_CANCELLED -> "Hủy yêu cầu";
            case FREELANCER_TIMEOUT -> "Freelancer quá hạn";
            case EMPLOYER_TIMEOUT -> "Employer quá hạn";
            case JOB_REOPENED -> "Mở lại công việc";
            case AUTO_APPROVED -> "Tự động duyệt";
            case DISPUTE_CREATED -> "Tạo khiếu nại";
            case DISPUTE_RESPONSE_SUBMITTED -> "Phản hồi khiếu nại";
            case DISPUTE_RESOLVED -> "Giải quyết tranh chấp";
        };
    }
}
