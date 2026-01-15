package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"job_id", "freelancer_id"})
        })
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EApplicationStatus status = EApplicationStatus.PENDING;

    // Work submission fields
    @Enumerated(EnumType.STRING)
    @Column(name = "work_status", length = 20)
    @Builder.Default
    private EWorkStatus workStatus = EWorkStatus.NOT_STARTED;

    @Column(name = "work_submission_url", length = 500)
    private String workSubmissionUrl;

    @Column(name = "work_submission_note", columnDefinition = "TEXT")
    private String workSubmissionNote;

    @Column(name = "work_submitted_at")
    private LocalDateTime workSubmittedAt;

    @Column(name = "work_revision_note", columnDefinition = "TEXT")
    private String workRevisionNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void accept() {
        this.status = EApplicationStatus.ACCEPTED;
    }

    public void reject() {
        this.status = EApplicationStatus.REJECTED;
    }

    public void withdraw() {
        this.status = EApplicationStatus.WITHDRAWN;
    }

    public void reapply(String coverLetter) {
        this.status = EApplicationStatus.PENDING;
        this.coverLetter = coverLetter;
    }

    public boolean isWithdrawn() {
        return this.status == EApplicationStatus.WITHDRAWN;
    }

    public boolean isPending() {
        return this.status == EApplicationStatus.PENDING;
    }

    public boolean isOwnedBy(Long userId) {
        return this.freelancer != null && this.freelancer.getId().equals(userId);
    }

    public boolean isJobOwnedBy(Long userId) {
        return this.job != null && this.job.getEmployer() != null 
                && this.job.getEmployer().getId().equals(userId);
    }

    // Work submission methods
    public void startWork() {
        if (this.status == EApplicationStatus.ACCEPTED && this.workStatus == EWorkStatus.NOT_STARTED) {
            this.workStatus = EWorkStatus.IN_PROGRESS;
        }
    }

    public void submitWork(String url, String note) {
        this.workSubmissionUrl = url;
        this.workSubmissionNote = note;
        this.workSubmittedAt = LocalDateTime.now();
        this.workStatus = EWorkStatus.SUBMITTED;
        this.workRevisionNote = null;
    }

    public void approveWork() {
        this.workStatus = EWorkStatus.APPROVED;
    }

    public void requestRevision(String note) {
        this.workStatus = EWorkStatus.REVISION_REQUESTED;
        this.workRevisionNote = note;
    }

    public boolean isAccepted() {
        return this.status == EApplicationStatus.ACCEPTED;
    }

    public boolean isWorkSubmitted() {
        return this.workStatus == EWorkStatus.SUBMITTED;
    }

    public boolean isWorkApproved() {
        return this.workStatus == EWorkStatus.APPROVED;
    }

    public boolean canSubmitWork() {
        return this.status == EApplicationStatus.ACCEPTED 
                && (this.workStatus == EWorkStatus.IN_PROGRESS 
                    || this.workStatus == EWorkStatus.NOT_STARTED
                    || this.workStatus == EWorkStatus.REVISION_REQUESTED);
    }

    public void setStatus(EApplicationStatus status) {
        this.status = status;
    }

    /**
     * Clear work submission data (dùng khi freelancer bị timeout)
     */
    public void clearWorkSubmission() {
        this.workStatus = EWorkStatus.NOT_STARTED;
        this.workSubmissionUrl = null;
        this.workSubmissionNote = null;
        this.workSubmittedAt = null;
        this.workRevisionNote = null;
    }
}
