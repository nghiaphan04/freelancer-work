package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_purchases")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class CreditPurchase {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "credit_package", nullable = false, length = 20)
    private ECreditPackage creditPackage;

    @Column(name = "credits_amount", nullable = false)
    private Integer creditsAmount;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";

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
    private EPaymentStatus status = EPaymentStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "payment_channel")
    private Integer paymentChannel;

    @Column(name = "credits_granted")
    @Builder.Default
    private Boolean creditsGranted = false;

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
        this.status = EPaymentStatus.PAID;
        this.paidAt = LocalDateTime.now();
        this.zpTransId = zpTransId;
        this.paymentChannel = channel;
    }

    public void markAsCancelled() {
        this.status = EPaymentStatus.CANCELLED;
    }

    public void markAsExpired() {
        this.status = EPaymentStatus.EXPIRED;
    }

    public void markCreditsGranted() {
        this.creditsGranted = true;
    }

    public boolean isPending() {
        return this.status == EPaymentStatus.PENDING;
    }

    public boolean isPaid() {
        return this.status == EPaymentStatus.PAID;
    }

    public boolean canGrantCredits() {
        return this.status == EPaymentStatus.PAID && !this.creditsGranted;
    }
}
