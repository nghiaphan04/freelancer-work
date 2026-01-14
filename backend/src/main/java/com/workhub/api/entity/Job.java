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
    private String context;             // Bối cảnh dự án/công ty

    @Column(columnDefinition = "TEXT")
    private String requirements;        // Yêu cầu cụ thể

    @Column(columnDefinition = "TEXT")
    private String deliverables;        // Sản phẩm bàn giao

    
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
    private BigDecimal escrowAmount;  // Số tiền đã giữ (budget + fee)

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";

    
    @Column(name = "application_deadline")
    private LocalDateTime applicationDeadline;  // Hạn nộp hồ sơ

    @Column(name = "expected_start_date")
    private LocalDateTime expectedStartDate;    // Ngày dự kiến bắt đầu

    @Column(name = "submission_days")
    @Builder.Default
    private Integer submissionDays = 1; // Số ngày nộp sản phẩm (từ lúc duyệt freelancer)

    @Column(name = "review_days")
    @Builder.Default
    private Integer reviewDays = 2; // Số ngày employer phải review sau khi nộp

    
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

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;  // Lý do từ chối (nếu bị reject)

    // Deadline fields cho TH2 timeout
    @Column(name = "work_submission_deadline")
    private LocalDateTime workSubmissionDeadline;  // Hạn nộp sản phẩm (set khi accept freelancer)

    @Column(name = "work_review_deadline")
    private LocalDateTime workReviewDeadline;  // Hạn review sản phẩm (set khi freelancer nộp)

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
        this.context = context;
        this.requirements = requirements;
        this.deliverables = deliverables;
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
        this.applicationDeadline = applicationDeadline;
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

    // Submit job for approval
    public void submitForApproval() {
        if (this.status == EJobStatus.DRAFT || this.status == EJobStatus.REJECTED) {
            this.status = EJobStatus.PENDING_APPROVAL;
            this.rejectionReason = null;
        }
    }

    // Admin approves job
    public void approve() {
        if (this.status == EJobStatus.PENDING_APPROVAL) {
            this.status = EJobStatus.OPEN;
            this.rejectionReason = null;
        }
    }

    // Admin rejects job
    public void reject(String reason) {
        if (this.status == EJobStatus.PENDING_APPROVAL) {
            this.status = EJobStatus.REJECTED;
            this.rejectionReason = reason;
        }
    }

    public boolean isPendingApproval() {
        return this.status == EJobStatus.PENDING_APPROVAL;
    }

    public boolean isRejected() {
        return this.status == EJobStatus.REJECTED;
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

    // Deadline methods
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

    /**
     * Mở lại job sau khi clear freelancer timeout
     */
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

    // Dispute methods
    public void dispute() {
        if (this.status == EJobStatus.IN_PROGRESS) {
            this.status = EJobStatus.DISPUTED;
            this.workReviewDeadline = null;  // Clear review deadline khi dispute
        }
    }

    public boolean isDisputed() {
        return this.status == EJobStatus.DISPUTED;
    }

    public boolean isInProgress() {
        return this.status == EJobStatus.IN_PROGRESS;
    }
}
