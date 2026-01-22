package com.workhub.api.dto.response;

import com.workhub.api.entity.EJobComplexity;
import com.workhub.api.entity.EJobDuration;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.entity.EPendingBlockchainAction;
import com.workhub.api.entity.EWorkStatus;
import com.workhub.api.entity.EWorkType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private String context;
    private String requirements;
    private String deliverables;
    private Set<String> skills;
    private EJobComplexity complexity;
    private EJobDuration duration;
    private EWorkType workType;
    private BigDecimal budget;
    private BigDecimal escrowAmount;
    private String currency;
    private LocalDateTime applicationDeadline;
    private Integer submissionDays;
    private Integer reviewDays;
    private EJobStatus status;
    private LocalDateTime workSubmissionDeadline;
    private LocalDateTime workReviewDeadline;
    private Integer viewCount;
    private Integer applicationCount;
    private EmployerResponse employer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private EWorkStatus workStatus;
    private String workSubmissionUrl;
    private String workSubmissionNote;
    private LocalDateTime workSubmittedAt;

    private Long escrowId;
    private String employerWalletAddress;
    private String freelancerWalletAddress;
    private String escrowTxHash;
    private String paymentTxHash;
    private String refundTxHash;
    private EPendingBlockchainAction pendingBlockchainAction;
    
    private LocalDateTime acceptedAt;
    private LocalDateTime signDeadline;
    private LocalDateTime contractSignedAt;
    private LocalDateTime jobWorkSubmittedAt;

    // Dispute info (for DISPUTED status)
    private DisputeInfo disputeInfo;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisputeInfo {
        private Long id;
        private String status;
        private LocalDateTime evidenceDeadline;
        private Boolean hasFreelancerEvidence;
        private Integer currentRound;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployerResponse {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private String walletAddress;
        private String title;
        private String company;
        private String location;
        private Boolean isVerified;
        private Integer trustScore;
        private Integer untrustScore;
    }
}
