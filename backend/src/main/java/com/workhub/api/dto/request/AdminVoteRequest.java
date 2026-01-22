package com.workhub.api.dto.request;

import lombok.Data;

@Data
public class AdminVoteRequest {
    private boolean employerWins;
    private String txHash;
}
