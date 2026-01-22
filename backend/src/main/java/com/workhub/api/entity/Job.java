package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "jobs")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String deliverables;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill", length = 100)
    @Builder.Default
    private Set<String> skills = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EJobComplexity complexity = EJobComplexity.INTERMEDIATE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EJobDuration duration = EJobDuration.SHORT_TERM;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 20)
    @Builder.Default
    private EWorkType workType = EWorkType.PART_TIME;

    @Column(precision = 15, scale = 2)
    private BigDecimal budget;

    @Column(name = "escrow_amount", precision = 15, scale = 2)
    private BigDecimal escrowAmount;

    @Column(length = 10)
    @Builder.Default
    private String currency = "APT";

    @Column(name = "escrow_id")
    private Long escrowId;

    @Column(name = "employer_wallet_address", length = 66)
    private String employerWalletAddress;

    @Column(name = "freelancer_wallet_address", length = 66)
    private String freelancerWalletAddress;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "contract_signed_at")
    private LocalDateTime contractSignedAt;

    @Column(name = "work_submitted_at")
    private LocalDateTime workSubmittedAt;

    @Column(name = "escrow_tx_hash", length = 66)
    private String escrowTxHash;

    @Column(name = "payment_tx_hash", length = 66)
    private String paymentTxHash;

    @Column(name = "refund_tx_hash", length = 66)
    private String refundTxHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "pending_blockchain_action", length = 30)
    @Builder.Default
    private EPendingBlockchainAction pendingBlockchainAction = EPendingBlockchainAction.NONE;

    @Column(name = "application_deadline")
    private LocalDateTime applicationDeadline;

    @Column(name = "expected_start_date")
    private LocalDateTime expectedStartDate;

    @Column(name = "submission_days")
    @Builder.Default
    private Integer submissionDays = 1;

    @Column(name = "review_days")
    @Builder.Default
    private Integer reviewDays = 2;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EJobStatus status = EJobStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private User employer;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "application_count", nullable = false)
    @Builder.Default
    private Integer applicationCount = 0;

    @Column(name = "work_submission_deadline")
    private LocalDateTime workSubmissionDeadline;

    @Column(name = "work_review_deadline")
    private LocalDateTime workReviewDeadline;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void update(String title, String description, String context,
                       String requirements, String deliverables, Set<String> skills,
                       EJobComplexity complexity, EJobDuration duration, EWorkType workType,
                       BigDecimal budget, String currency,
                       LocalDateTime applicationDeadline,
                       Integer submissionDays, Integer reviewDays) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (description != null && !description.isBlank()) {
            this.description = description;
        }
        if (context != null) {
            this.context = context;
        }
        if (requirements != null) {
            this.requirements = requirements;
        }
        if (deliverables != null) {
            this.deliverables = deliverables;
        }
        if (skills != null) {
            this.skills = skills;
        }
        if (complexity != null) {
            this.complexity = complexity;
        }
        if (duration != null) {
            this.duration = duration;
        }
        if (workType != null) {
            this.workType = workType;
        }
        if (budget != null) {
            this.budget = budget;
        }
        if (currency != null && !currency.isBlank()) {
            this.currency = currency;
        }
        if (applicationDeadline != null) {
            this.applicationDeadline = applicationDeadline;
        }
        if (submissionDays != null && submissionDays >= 1) {
            this.submissionDays = submissionDays;
        }
        if (reviewDays != null && reviewDays >= 2) {
            this.reviewDays = reviewDays;
        }
    }

    public void publish() {
        if (this.status == EJobStatus.DRAFT || this.status == EJobStatus.CANCELLED) {
            this.status = EJobStatus.OPEN;
        }
    }

    public void close() {
        this.status = EJobStatus.CANCELLED;
    }

    public void startProgress() {
        if (this.status == EJobStatus.OPEN) {
            this.status = EJobStatus.IN_PROGRESS;
        }
    }

    public void complete() {
        if (this.status == EJobStatus.IN_PROGRESS) {
            this.status = EJobStatus.COMPLETED;
        }
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementApplicationCount() {
        this.applicationCount++;
    }

    public boolean isOwnedBy(Long userId) {
        return this.employer != null && this.employer.getId().equals(userId);
    }

    public boolean isOpen() {
        return this.status == EJobStatus.OPEN;
    }

    public boolean isExpired() {
        return this.applicationDeadline != null 
            && LocalDateTime.now().isAfter(this.applicationDeadline);
    }

    public void setStatus(EJobStatus status) {
        this.status = status;
    }

    public void setWorkSubmissionDeadline(LocalDateTime deadline) {
        this.workSubmissionDeadline = deadline;
    }

    public void setWorkReviewDeadline(LocalDateTime deadline) {
        this.workReviewDeadline = deadline;
    }

    public void clearDeadlines() {
        this.workSubmissionDeadline = null;
        this.workReviewDeadline = null;
    }

    public void reopenJob() {
        if (this.status == EJobStatus.IN_PROGRESS) {
            this.status = EJobStatus.OPEN;
            this.workSubmissionDeadline = null;
            this.workReviewDeadline = null;
        }
    }

    public boolean isWorkSubmissionOverdue() {
        return this.workSubmissionDeadline != null 
            && LocalDateTime.now().isAfter(this.workSubmissionDeadline);
    }

    public boolean isWorkReviewOverdue() {
        return this.workReviewDeadline != null 
            && LocalDateTime.now().isAfter(this.workReviewDeadline);
    }

    public void dispute() {
        if (this.status == EJobStatus.IN_PROGRESS) {
            this.status = EJobStatus.DISPUTED;
            this.workReviewDeadline = null;
        }
    }

    public boolean isDisputed() {
        return this.status == EJobStatus.DISPUTED;
    }

    public boolean isInProgress() {
        return this.status == EJobStatus.IN_PROGRESS;
    }

    public void setEscrowId(Long escrowId) {
        this.escrowId = escrowId;
    }

    public void setEmployerWalletAddress(String address) {
        this.employerWalletAddress = address;
    }

    public void setFreelancerWalletAddress(String address) {
        this.freelancerWalletAddress = address;
    }

    public String getEmployerWalletAddress() {
        return this.employerWalletAddress;
    }

    public String getFreelancerWalletAddress() {
        return this.freelancerWalletAddress;
    }

    public LocalDateTime getAcceptedAt() {
        return this.acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getContractSignedAt() {
        return this.contractSignedAt;
    }

    public void setContractSignedAt(LocalDateTime contractSignedAt) {
        this.contractSignedAt = contractSignedAt;
    }

    public LocalDateTime getWorkSubmittedAt() {
        return this.workSubmittedAt;
    }

    public void setWorkSubmittedAt(LocalDateTime workSubmittedAt) {
        this.workSubmittedAt = workSubmittedAt;
    }

    public void setEscrowTxHash(String txHash) {
        this.escrowTxHash = txHash;
    }

    public void setPaymentTxHash(String txHash) {
        this.paymentTxHash = txHash;
    }

    public String getRefundTxHash() {
        return refundTxHash;
    }

    public void setRefundTxHash(String txHash) {
        this.refundTxHash = txHash;
    }

    public void setEscrowAmount(BigDecimal amount) {
        this.escrowAmount = amount;
    }

    public void setPendingBlockchainAction(EPendingBlockchainAction action) {
        this.pendingBlockchainAction = action;
    }

    public void clearPendingBlockchainAction() {
        this.pendingBlockchainAction = EPendingBlockchainAction.NONE;
    }

    public boolean hasPendingBlockchainAction() {
        return this.pendingBlockchainAction != null 
            && this.pendingBlockchainAction != EPendingBlockchainAction.NONE;
    }
}
