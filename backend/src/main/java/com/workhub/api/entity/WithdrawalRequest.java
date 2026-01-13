package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "withdrawal_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EWithdrawalRequestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EWithdrawalRequestStatus status = EWithdrawalRequestStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "penalty_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal penaltyFee;

    @Column(name = "penalty_percent", nullable = false)
    private Integer penaltyPercent;

    @Column(name = "response_message", columnDefinition = "TEXT")
    private String responseMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id")
    private User responder;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isPending() {
        return this.status == EWithdrawalRequestStatus.PENDING;
    }

    public boolean isApproved() {
        return this.status == EWithdrawalRequestStatus.APPROVED;
    }

    public void approve(User responder, String message) {
        this.status = EWithdrawalRequestStatus.APPROVED;
        this.responder = responder;
        this.responseMessage = message;
        this.respondedAt = LocalDateTime.now();
    }

    public void reject(User responder, String message) {
        this.status = EWithdrawalRequestStatus.REJECTED;
        this.responder = responder;
        this.responseMessage = message;
        this.respondedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = EWithdrawalRequestStatus.CANCELLED;
    }

    public boolean isFreelancerRequest() {
        return this.type == EWithdrawalRequestType.FREELANCER_WITHDRAW;
    }

    public boolean isEmployerRequest() {
        return this.type == EWithdrawalRequestType.EMPLOYER_CANCEL;
    }
}
