package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_contracts")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class JobContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @Column(name = "budget", precision = 15, scale = 2, nullable = false)
    private BigDecimal budget;

    @Column(name = "currency", length = 10, nullable = false)
    @Builder.Default
    private String currency = "APT";

    @Column(name = "deadline_days", nullable = false)
    private Integer deadlineDays;

    @Column(name = "review_days", nullable = false)
    private Integer reviewDays;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "deliverables", columnDefinition = "TEXT")
    private String deliverables;

    @Column(name = "terms_json", columnDefinition = "TEXT")
    private String termsJson; // JSON array of {title, content}

    @Column(name = "contract_hash", length = 128, nullable = false)
    private String contractHash;

    @Column(name = "employer_signed")
    @Builder.Default
    private Boolean employerSigned = true;

    @Column(name = "employer_signed_at")
    private LocalDateTime employerSignedAt;

    @Column(name = "freelancer_signed")
    @Builder.Default
    private Boolean freelancerSigned = false;

    @Column(name = "freelancer_signed_at")
    private LocalDateTime freelancerSignedAt;

    @Column(name = "freelancer_signature_tx", length = 128)
    private String freelancerSignatureTx;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
