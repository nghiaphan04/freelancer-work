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
                       LocalDateTime applicationDeadline, LocalDateTime expectedStartDate) {
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
        this.expectedStartDate = expectedStartDate;
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
}
