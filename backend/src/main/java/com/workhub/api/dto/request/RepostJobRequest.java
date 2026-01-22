package com.workhub.api.dto.request;

import lombok.Data;

@Data
public class RepostJobRequest {
    private Boolean saveAsDraft;
    private Long escrowId;
    private String walletAddress;
    private String txHash;
    private String contractHash;  // Hash từ frontend để đảm bảo khớp với blockchain
}
