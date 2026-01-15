package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_histories")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class JobHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EJobHistoryAction action;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public boolean isEmployerAction() {
        return action == EJobHistoryAction.JOB_CREATED
                || action == EJobHistoryAction.JOB_UPDATED
                || action == EJobHistoryAction.JOB_SUBMITTED
                || action == EJobHistoryAction.JOB_OPENED
                || action == EJobHistoryAction.JOB_CLOSED
                || action == EJobHistoryAction.APPLICATION_ACCEPTED
                || action == EJobHistoryAction.APPLICATION_REJECTED
                || action == EJobHistoryAction.WORK_APPROVED
                || action == EJobHistoryAction.WORK_REJECTED
                || action == EJobHistoryAction.PAYMENT_RELEASED;
    }

    public boolean isFreelancerAction() {
        return action == EJobHistoryAction.APPLICATION_SUBMITTED
                || action == EJobHistoryAction.APPLICATION_WITHDRAWN
                || action == EJobHistoryAction.WORK_STARTED
                || action == EJobHistoryAction.WORK_SUBMITTED
                || action == EJobHistoryAction.WORK_REVISED;
    }

    public boolean isSystemAction() {
        return action == EJobHistoryAction.JOB_APPROVED
                || action == EJobHistoryAction.JOB_REJECTED
                || action == EJobHistoryAction.JOB_COMPLETED
                || action == EJobHistoryAction.JOB_CANCELLED;
    }
}
