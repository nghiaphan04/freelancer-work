package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "balance_deposits")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class BalanceDeposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "app_trans_id", unique = true, nullable = false, length = 50)
    private String appTransId;

    @Column(name = "zp_trans_id")
    private Long zpTransId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(length = 500)
    private String description;

    @Column(name = "order_url", length = 1000)
    private String orderUrl;

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;

    @Column(name = "zp_trans_token", length = 100)
    private String zpTransToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EDepositStatus status = EDepositStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "payment_channel")
    private Integer paymentChannel;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void setZaloPayInfo(String orderUrl, String qrCode, String zpTransToken) {
        this.orderUrl = orderUrl;
        this.qrCode = qrCode;
        this.zpTransToken = zpTransToken;
    }

    public void markAsPaid(Long zpTransId, Integer channel) {
        this.status = EDepositStatus.PAID;
        this.paidAt = LocalDateTime.now();
        this.zpTransId = zpTransId;
        this.paymentChannel = channel;
    }

    public void markAsCancelled() {
        this.status = EDepositStatus.CANCELLED;
    }

    public void markAsExpired() {
        this.status = EDepositStatus.EXPIRED;
    }

    public boolean isPending() {
        return this.status == EDepositStatus.PENDING;
    }

    public boolean isPaid() {
        return this.status == EDepositStatus.PAID;
    }
}
