package com.workhub.api.dto.response;

import com.workhub.api.entity.EWithdrawalRequestStatus;
import com.workhub.api.entity.EWithdrawalRequestType;
import com.workhub.api.entity.WithdrawalRequest;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WithdrawalRequestResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private EWithdrawalRequestType type;
    private String typeLabel;
    private EWithdrawalRequestStatus status;
    private String statusLabel;
    private String reason;
    private BigDecimal penaltyFee;
    private Integer penaltyPercent;
    private String responseMessage;
    private RequesterInfo requester;
    private RequesterInfo responder;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class RequesterInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
    }

    public static WithdrawalRequestResponse fromEntity(WithdrawalRequest request) {
        return WithdrawalRequestResponse.builder()
                .id(request.getId())
                .jobId(request.getJob().getId())
                .jobTitle(request.getJob().getTitle())
                .type(request.getType())
                .typeLabel(getTypeLabel(request.getType()))
                .status(request.getStatus())
                .statusLabel(getStatusLabel(request.getStatus()))
                .reason(request.getReason())
                .penaltyFee(request.getPenaltyFee())
                .penaltyPercent(request.getPenaltyPercent())
                .responseMessage(request.getResponseMessage())
                .requester(RequesterInfo.builder()
                        .id(request.getRequester().getId())
                        .fullName(request.getRequester().getFullName())
                        .avatarUrl(request.getRequester().getAvatarUrl())
                        .build())
                .responder(request.getResponder() != null ? RequesterInfo.builder()
                        .id(request.getResponder().getId())
                        .fullName(request.getResponder().getFullName())
                        .avatarUrl(request.getResponder().getAvatarUrl())
                        .build() : null)
                .respondedAt(request.getRespondedAt())
                .createdAt(request.getCreatedAt())
                .build();
    }

    private static String getTypeLabel(EWithdrawalRequestType type) {
        return switch (type) {
            case FREELANCER_WITHDRAW -> "Freelancer xin rút";
            case EMPLOYER_CANCEL -> "Bên thuê xin hủy";
        };
    }

    private static String getStatusLabel(EWithdrawalRequestStatus status) {
        return switch (status) {
            case PENDING -> "Đang chờ xác nhận";
            case APPROVED -> "Đã chấp nhận";
            case REJECTED -> "Đã từ chối";
            case CANCELLED -> "Đã hủy yêu cầu";
        };
    }
}
