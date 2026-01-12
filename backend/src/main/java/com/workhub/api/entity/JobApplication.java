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
}
