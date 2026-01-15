package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "disputes")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private User employer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    // Employer evidence
    @Column(name = "employer_evidence_url", length = 500)
    private String employerEvidenceUrl;  // Link file PDF bằng chứng

    @Column(name = "employer_evidence_file_id")
    private Long employerEvidenceFileId;

    @Column(name = "employer_description", columnDefinition = "TEXT", nullable = false)
    private String employerDescription;  // Mô tả sai phạm

    // Freelancer response
    @Column(name = "freelancer_evidence_url", length = 500)
    private String freelancerEvidenceUrl;  // Link file PDF phản hồi

    @Column(name = "freelancer_evidence_file_id")
    private Long freelancerEvidenceFileId;

    @Column(name = "freelancer_description", columnDefinition = "TEXT")
    private String freelancerDescription;  // Mô tả phản hồi

    // Deadline for freelancer to respond
    @Column(name = "freelancer_deadline")
    private LocalDateTime freelancerDeadline;

    // Admin decision
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EDisputeStatus status = EDisputeStatus.PENDING_FREELANCER_RESPONSE;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;  // Ghi chú của admin khi quyết định

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;  // Admin đã xử lý

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===== METHODS =====

    /**
     * Admin yêu cầu freelancer phản hồi
     */
    public void requestFreelancerResponse(int daysToRespond) {
        this.freelancerDeadline = LocalDateTime.now().plusDays(daysToRespond);
        this.status = EDisputeStatus.PENDING_FREELANCER_RESPONSE;
    }

    /**
     * Freelancer gửi phản hồi
     */
    public void submitFreelancerResponse(String evidenceUrl, String description) {
        this.freelancerEvidenceUrl = evidenceUrl;
        this.freelancerDescription = description;
        this.status = EDisputeStatus.PENDING_ADMIN_DECISION;
    }

    /**
     * Chuyển sang chờ admin quyết định (khi freelancer hết hạn phản hồi)
     */
    public void moveToAdminDecision() {
        this.status = EDisputeStatus.PENDING_ADMIN_DECISION;
    }

    /**
     * Admin quyết định employer thắng
     */
    public void resolveForEmployer(User admin, String note) {
        this.status = EDisputeStatus.EMPLOYER_WON;
        this.resolvedBy = admin;
        this.adminNote = note;
        this.resolvedAt = LocalDateTime.now();
    }

    /**
     * Admin quyết định freelancer thắng
     */
    public void resolveForFreelancer(User admin, String note) {
        this.status = EDisputeStatus.FREELANCER_WON;
        this.resolvedBy = admin;
        this.adminNote = note;
        this.resolvedAt = LocalDateTime.now();
    }

    /**
     * Hủy tranh chấp
     */
    public void cancel() {
        this.status = EDisputeStatus.CANCELLED;
    }

    public boolean isPendingFreelancerResponse() {
        return this.status == EDisputeStatus.PENDING_FREELANCER_RESPONSE;
    }

    public boolean isPendingAdminDecision() {
        return this.status == EDisputeStatus.PENDING_ADMIN_DECISION;
    }

    public boolean isResolved() {
        return this.status == EDisputeStatus.EMPLOYER_WON 
            || this.status == EDisputeStatus.FREELANCER_WON;
    }

    public boolean isFreelancerDeadlineExpired() {
        return this.freelancerDeadline != null 
            && LocalDateTime.now().isAfter(this.freelancerDeadline);
    }

    public boolean canFreelancerRespond() {
        return this.status == EDisputeStatus.PENDING_FREELANCER_RESPONSE
            && !isFreelancerDeadlineExpired();
    }
}
