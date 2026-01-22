package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Column(name = "employer_evidence_url", length = 500)
    private String employerEvidenceUrl;

    @Column(name = "employer_evidence_file_id")
    private Long employerEvidenceFileId;

    @Column(name = "employer_description", columnDefinition = "TEXT", nullable = false)
    private String employerDescription;

    @Column(name = "freelancer_evidence_url", length = 500)
    private String freelancerEvidenceUrl;

    @Column(name = "freelancer_evidence_file_id")
    private Long freelancerEvidenceFileId;

    @Column(name = "freelancer_description", columnDefinition = "TEXT")
    private String freelancerDescription;

    @Column(name = "evidence_deadline")
    private LocalDateTime evidenceDeadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EDisputeStatus status = EDisputeStatus.PENDING_FREELANCER_RESPONSE;

    @Column(name = "current_round")
    @Builder.Default
    private Integer currentRound = 0;

    @Column(name = "round1_winner_wallet", length = 66)
    private String round1WinnerWallet;

    @Column(name = "round2_winner_wallet", length = 66)
    private String round2WinnerWallet;

    @Column(name = "round3_winner_wallet", length = 66)
    private String round3WinnerWallet;

    @Column(name = "final_winner_wallet", length = 66)
    private String finalWinnerWallet;

    @Column(name = "employer_wins")
    private Boolean employerWins;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "blockchain_dispute_id")
    private Long blockchainDisputeId;

    @Column(name = "dispute_tx_hash", length = 66)
    private String disputeTxHash;

    @Column(name = "resolution_tx_hash", length = 66)
    private String resolutionTxHash;

    @Column(name = "blockchain_resolved")
    @Builder.Default
    private Boolean blockchainResolved = false;

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DisputeRound> rounds = new ArrayList<>();

    // FOR TESTING: Use seconds instead of hours
    public void setEvidenceDeadlineSeconds(int seconds) {
        this.evidenceDeadline = LocalDateTime.now().plusSeconds(seconds);
    }

    public boolean isEvidenceDeadlineExpired() {
        return this.evidenceDeadline != null && LocalDateTime.now().isAfter(this.evidenceDeadline);
    }

    public boolean hasFreelancerEvidence() {
        return this.freelancerEvidenceUrl != null || this.freelancerDescription != null;
    }

    public void startVoting() {
        this.status = EDisputeStatus.VOTING_ROUND_1;
        this.currentRound = 1;
    }

    public void advanceToNextRound() {
        this.currentRound++;
        if (currentRound == 2) {
            this.status = EDisputeStatus.VOTING_ROUND_2;
        } else if (currentRound == 3) {
            this.status = EDisputeStatus.VOTING_ROUND_3;
        }
    }

    public boolean isVoting() {
        return status == EDisputeStatus.VOTING_ROUND_1 
            || status == EDisputeStatus.VOTING_ROUND_2 
            || status == EDisputeStatus.VOTING_ROUND_3;
    }

    public boolean isPendingFreelancerResponse() {
        return this.status == EDisputeStatus.PENDING_FREELANCER_RESPONSE;
    }

    public boolean isResolved() {
        return this.status == EDisputeStatus.EMPLOYER_WON 
            || this.status == EDisputeStatus.FREELANCER_WON;
    }

    public boolean needsBlockchainResolution() {
        return isResolved() && !Boolean.TRUE.equals(this.blockchainResolved);
    }

    public void markBlockchainResolved(String txHash) {
        this.resolutionTxHash = txHash;
        this.blockchainResolved = true;
    }

    public void setRoundWinner(int round, String winnerWallet) {
        switch (round) {
            case 1 -> this.round1WinnerWallet = winnerWallet;
            case 2 -> this.round2WinnerWallet = winnerWallet;
            case 3 -> this.round3WinnerWallet = winnerWallet;
        }
    }

    public int countEmployerVotes() {
        String employerWallet = this.employer.getWalletAddress();
        int count = 0;
        if (employerWallet.equals(round1WinnerWallet)) count++;
        if (employerWallet.equals(round2WinnerWallet)) count++;
        if (employerWallet.equals(round3WinnerWallet)) count++;
        return count;
    }

    public int countFreelancerVotes() {
        String freelancerWallet = this.freelancer.getWalletAddress();
        int count = 0;
        if (freelancerWallet.equals(round1WinnerWallet)) count++;
        if (freelancerWallet.equals(round2WinnerWallet)) count++;
        if (freelancerWallet.equals(round3WinnerWallet)) count++;
        return count;
    }

    public void finalizeResult() {
        int employerVotes = countEmployerVotes();
        int freelancerVotes = countFreelancerVotes();
        
        if (employerVotes >= 2) {
            this.employerWins = true;
            // Try employer wallet, then job employer wallet
            String wallet = this.employer.getWalletAddress();
            if (wallet == null && this.job != null) {
                wallet = this.job.getEmployerWalletAddress();
            }
            this.finalWinnerWallet = wallet;
            this.status = EDisputeStatus.EMPLOYER_WON;
        } else if (freelancerVotes >= 2) {
            this.employerWins = false;
            // Try freelancer wallet, then job freelancer wallet
            String wallet = this.freelancer.getWalletAddress();
            if (wallet == null && this.job != null) {
                wallet = this.job.getFreelancerWalletAddress();
            }
            this.finalWinnerWallet = wallet;
            this.status = EDisputeStatus.FREELANCER_WON;
        }
        this.resolvedAt = LocalDateTime.now();
    }

    public void autoWinEmployer() {
        this.employerWins = true;
        // Try employer wallet, then job employer wallet
        String wallet = this.employer.getWalletAddress();
        if (wallet == null && this.job != null) {
            wallet = this.job.getEmployerWalletAddress();
        }
        this.finalWinnerWallet = wallet;
        this.status = EDisputeStatus.EMPLOYER_WON;
        this.resolvedAt = LocalDateTime.now();
    }

    public void autoWinFreelancer() {
        this.employerWins = false;
        // Try freelancer wallet, then job freelancer wallet
        String wallet = this.freelancer.getWalletAddress();
        if (wallet == null && this.job != null) {
            wallet = this.job.getFreelancerWalletAddress();
        }
        this.finalWinnerWallet = wallet;
        this.status = EDisputeStatus.FREELANCER_WON;
        this.resolvedAt = LocalDateTime.now();
    }

    // For setting winner wallet explicitly
    public void setFinalWinnerWalletFromJob() {
        if (this.finalWinnerWallet == null && this.job != null) {
            if (Boolean.TRUE.equals(this.employerWins)) {
                this.finalWinnerWallet = this.job.getEmployerWalletAddress();
            } else {
                this.finalWinnerWallet = this.job.getFreelancerWalletAddress();
            }
        }
    }
}
