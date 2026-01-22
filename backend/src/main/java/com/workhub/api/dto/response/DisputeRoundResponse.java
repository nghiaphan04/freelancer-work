package com.workhub.api.dto.response;

import com.workhub.api.entity.DisputeRound;
import com.workhub.api.entity.EDisputeRoundStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DisputeRoundResponse {
    private Long id;
    private Long disputeId;
    private Long blockchainDisputeId;
    private Integer roundNumber;
    
    private Long adminId;
    private String adminName;
    private String adminWallet;
    
    private String winnerWallet;
    private Boolean winnerIsEmployer;
    private LocalDateTime votedAt;
    
    private EDisputeRoundStatus status;
    private LocalDateTime voteDeadline;
    private Integer reselectionCount;
    
    private Long jobId;
    private String jobTitle;
    
    private String employerWallet;
    private String freelancerWallet;
    private String employerName;
    private String freelancerName;
    
    public static DisputeRoundResponse fromEntity(DisputeRound round) {
        return DisputeRoundResponse.builder()
                .id(round.getId())
                .disputeId(round.getDispute().getId())
                .blockchainDisputeId(round.getDispute().getBlockchainDisputeId())
                .roundNumber(round.getRoundNumber())
                .adminId(round.getAdmin() != null ? round.getAdmin().getId() : null)
                .adminName(round.getAdmin() != null ? round.getAdmin().getFullName() : null)
                .adminWallet(round.getAdminWallet())
                .winnerWallet(round.getWinnerWallet())
                .winnerIsEmployer(round.getWinnerIsEmployer())
                .votedAt(round.getVotedAt())
                .status(round.getStatus())
                .voteDeadline(round.getVoteDeadline())
                .reselectionCount(round.getReselectionCount())
                .jobId(round.getDispute().getJob().getId())
                .jobTitle(round.getDispute().getJob().getTitle())
                .employerWallet(round.getDispute().getEmployer().getWalletAddress())
                .freelancerWallet(round.getDispute().getFreelancer().getWalletAddress())
                .employerName(round.getDispute().getEmployer().getFullName())
                .freelancerName(round.getDispute().getFreelancer().getFullName())
                .build();
    }
}
