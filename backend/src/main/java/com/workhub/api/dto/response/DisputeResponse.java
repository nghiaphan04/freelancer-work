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
    private UserInfo employer;
    private String employerEvidenceUrl;
    private FileAttachment employerEvidenceFile;
    private String employerDescription;
    private UserInfo freelancer;
    private String freelancerEvidenceUrl;
    private FileAttachment freelancerEvidenceFile;
    private String freelancerDescription;
    private LocalDateTime evidenceDeadline;
    private EDisputeStatus status;
    private String statusLabel;
    private String adminNote;
    private UserInfo resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private Integer currentRound;
    private String round1WinnerWallet;
    private String round2WinnerWallet;
    private String round3WinnerWallet;
    private String finalWinnerWallet;
    private Boolean employerWins;
    private String resolutionTxHash;
    private Long escrowId;

    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private String walletAddress;
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
                        .walletAddress(dispute.getJob().getEmployerWalletAddress())
                        .build())
                .employerEvidenceUrl(dispute.getEmployerEvidenceUrl())
                .employerEvidenceFile(employerAttachment)
                .employerDescription(dispute.getEmployerDescription())
                .freelancer(UserInfo.builder()
                        .id(dispute.getFreelancer().getId())
                        .fullName(dispute.getFreelancer().getFullName())
                        .avatarUrl(dispute.getFreelancer().getAvatarUrl())
                        .walletAddress(dispute.getJob().getFreelancerWalletAddress())
                        .build())
                .freelancerEvidenceUrl(dispute.getFreelancerEvidenceUrl())
                .freelancerEvidenceFile(freelancerAttachment)
                .freelancerDescription(dispute.getFreelancerDescription())
                .evidenceDeadline(dispute.getEvidenceDeadline())
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
                .currentRound(dispute.getCurrentRound())
                .round1WinnerWallet(dispute.getRound1WinnerWallet())
                .round2WinnerWallet(dispute.getRound2WinnerWallet())
                .round3WinnerWallet(dispute.getRound3WinnerWallet())
                .finalWinnerWallet(dispute.getFinalWinnerWallet())
                .employerWins(dispute.getEmployerWins())
                .resolutionTxHash(dispute.getResolutionTxHash())
                .escrowId(dispute.getJob().getEscrowId())
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
            case VOTING_ROUND_1 -> "Đang vote Round 1";
            case VOTING_ROUND_2 -> "Đang vote Round 2";
            case VOTING_ROUND_3 -> "Đang vote Round 3";
            case EVIDENCE_TIMEOUT -> "Quá hạn gửi bằng chứng";
            case EMPLOYER_WON -> "Employer thắng";
            case FREELANCER_WON -> "Freelancer thắng";
            case EMPLOYER_CLAIMED -> "Employer đã nhận tiền";
            case FREELANCER_CLAIMED -> "Freelancer đã nhận tiền";
            case CANCELLED -> "Đã hủy";
        };
    }
}
