package com.workhub.api.dto.response;

import com.workhub.api.entity.ENotificationType;
import com.workhub.api.entity.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private ENotificationType type;
    private String typeLabel;
    private String title;
    private String message;
    private Long referenceId;
    private String referenceType;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .typeLabel(getTypeLabel(notification.getType()))
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private static String getTypeLabel(ENotificationType type) {
        return switch (type) {
            case APPLICATION_ACCEPTED -> "Đơn ứng tuyển được duyệt";
            case APPLICATION_REJECTED -> "Đơn ứng tuyển bị từ chối";
            case NEW_APPLICATION -> "Có ứng viên mới";
            case JOB_APPROVED -> "Công việc được duyệt";
            case JOB_REJECTED -> "Công việc bị từ chối";
            case WITHDRAWAL_REQUESTED -> "Có yêu cầu rút/hủy";
            case WITHDRAWAL_APPROVED -> "Yêu cầu được chấp nhận";
            case WITHDRAWAL_REJECTED -> "Yêu cầu bị từ chối";
            case JOB_CANCELLED -> "Công việc đã bị hủy";
            case WORK_SUBMITTED -> "Có sản phẩm mới nộp";
            case WORK_APPROVED -> "Sản phẩm được duyệt";
            case WORK_REVISION_REQUESTED -> "Yêu cầu chỉnh sửa";
            case PAYMENT_RELEASED -> "Đã nhận thanh toán";
            case JOB_COMPLETED -> "Công việc hoàn thành";
            case WORK_SUBMISSION_TIMEOUT -> "Quá hạn nộp sản phẩm";
            case WORK_REVIEW_TIMEOUT -> "Quá hạn duyệt sản phẩm";
            case JOB_REOPENED -> "Công việc được mở lại";
            case DISPUTE_CREATED -> "Có khiếu nại mới";
            case DISPUTE_RESPONSE_REQUESTED -> "Yêu cầu phản hồi khiếu nại";
            case DISPUTE_RESPONSE_SUBMITTED -> "Đã có phản hồi khiếu nại";
            case DISPUTE_RESOLVED_WIN -> "Bạn thắng tranh chấp";
            case DISPUTE_RESOLVED_LOSE -> "Bạn thua tranh chấp";
            case CHAT_REQUEST_RECEIVED -> "Có yêu cầu kết bạn mới";
            case CHAT_REQUEST_ACCEPTED -> "Yêu cầu kết bạn được chấp nhận";
            case CHAT_REQUEST_REJECTED -> "Yêu cầu kết bạn bị từ chối";
            case CHAT_BLOCKED -> "Bạn đã bị chặn";
            case SYSTEM -> "Thông báo hệ thống";
        };
    }
}
