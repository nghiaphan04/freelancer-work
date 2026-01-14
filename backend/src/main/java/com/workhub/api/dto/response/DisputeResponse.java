package com.workhub.api.dto.response;

import com.workhub.api.entity.Dispute;
import com.workhub.api.entity.EDisputeStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DisputeResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    
    // Employer info
    private UserInfo employer;
    private String employerEvidenceUrl;
    private FileAttachment employerEvidenceFile;
    private String employerDescription;
    
    // Freelancer info
    private UserInfo freelancer;
    private String freelancerEvidenceUrl;
    private FileAttachment freelancerEvidenceFile;
    private String freelancerDescription;
    private LocalDateTime freelancerDeadline;
    
    // Status
    private EDisputeStatus status;
    private String statusLabel;
    
    // Admin decision
    private String adminNote;
    private UserInfo resolvedBy;
    private LocalDateTime resolvedAt;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
    }

    public static DisputeResponse fromEntity(Dispute dispute,
                                             FileAttachment employerAttachment,
                                             FileAttachment freelancerAttachment) {
        return DisputeResponse.builder()
                .id(dispute.getId())
                .jobId(dispute.getJob().getId())
                .jobTitle(dispute.getJob().getTitle())
                .employer(UserInfo.builder()
                        .id(dispute.getEmployer().getId())
                        .fullName(dispute.getEmployer().getFullName())
                        .avatarUrl(dispute.getEmployer().getAvatarUrl())
                        .build())
                .employerEvidenceUrl(dispute.getEmployerEvidenceUrl())
                .employerEvidenceFile(employerAttachment)
                .employerDescription(dispute.getEmployerDescription())
                .freelancer(UserInfo.builder()
                        .id(dispute.getFreelancer().getId())
                        .fullName(dispute.getFreelancer().getFullName())
                        .avatarUrl(dispute.getFreelancer().getAvatarUrl())
                        .build())
                .freelancerEvidenceUrl(dispute.getFreelancerEvidenceUrl())
                .freelancerEvidenceFile(freelancerAttachment)
                .freelancerDescription(dispute.getFreelancerDescription())
                .freelancerDeadline(dispute.getFreelancerDeadline())
                .status(dispute.getStatus())
                .statusLabel(getStatusLabel(dispute.getStatus()))
                .adminNote(dispute.getAdminNote())
                .resolvedBy(dispute.getResolvedBy() != null ? UserInfo.builder()
                        .id(dispute.getResolvedBy().getId())
                        .fullName(dispute.getResolvedBy().getFullName())
                        .avatarUrl(dispute.getResolvedBy().getAvatarUrl())
                        .build() : null)
                .resolvedAt(dispute.getResolvedAt())
                .createdAt(dispute.getCreatedAt())
                .updatedAt(dispute.getUpdatedAt())
                .build();
    }

    @Data
    @Builder
    public static class FileAttachment {
        private Long id;
        private String secureUrl;
        private String originalFilename;
        private String readableSize;
    }

    private static String getStatusLabel(EDisputeStatus status) {
        return switch (status) {
            case PENDING_FREELANCER_RESPONSE -> "Chờ freelancer phản hồi";
            case PENDING_ADMIN_DECISION -> "Chờ admin quyết định";
            case EMPLOYER_WON -> "Employer thắng";
            case FREELANCER_WON -> "Freelancer thắng";
            case CANCELLED -> "Đã hủy";
        };
    }
}
