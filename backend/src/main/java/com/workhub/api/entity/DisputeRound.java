package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_rounds", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"dispute_id", "round_number"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class DisputeRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

    @Column(name = "admin_wallet", length = 66)
    private String adminWallet;

    @Column(name = "selected_at")
    private LocalDateTime selectedAt;

    @Column(name = "vote_deadline")
    private LocalDateTime voteDeadline;

    @Column(name = "winner_wallet", length = 66)
    private String winnerWallet;

    @Column(name = "winner_is_employer")
    private Boolean winnerIsEmployer;

    @Column(name = "voted_at")
    private LocalDateTime votedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EDisputeRoundStatus status = EDisputeRoundStatus.PENDING_ADMIN;

    @Column(name = "reselection_count")
    @Builder.Default
    private Integer reselectionCount = 0;

    @Column(name = "vote_tx_hash", length = 66)
    private String voteTxHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return this.voteDeadline != null && LocalDateTime.now().isAfter(this.voteDeadline);
    }

    public boolean isPending() {
        return this.status == EDisputeRoundStatus.PENDING_ADMIN;
    }

    public boolean isVoted() {
        return this.status == EDisputeRoundStatus.VOTED;
    }

    public void markAsVoted(String winnerWallet, boolean winnerIsEmployer, String txHash) {
        this.winnerWallet = winnerWallet;
        this.winnerIsEmployer = winnerIsEmployer;
        this.votedAt = LocalDateTime.now();
        this.voteTxHash = txHash;
        this.status = EDisputeRoundStatus.VOTED;
    }

    public void reassignAdmin(User newAdmin, int hoursToVote) {
        this.admin = newAdmin;
        this.adminWallet = newAdmin.getWalletAddress();
        this.selectedAt = LocalDateTime.now();
        this.voteDeadline = LocalDateTime.now().plusHours(hoursToVote);
        this.status = EDisputeRoundStatus.PENDING_ADMIN;
        this.reselectionCount = this.reselectionCount + 1;
    }

    // FOR TESTING: Use seconds instead of hours
    public void reassignAdminSeconds(User newAdmin, int secondsToVote) {
        this.admin = newAdmin;
        this.adminWallet = newAdmin.getWalletAddress();
        this.selectedAt = LocalDateTime.now();
        this.voteDeadline = LocalDateTime.now().plusSeconds(secondsToVote);
        this.status = EDisputeRoundStatus.PENDING_ADMIN;
        this.reselectionCount = this.reselectionCount + 1;
    }
}
