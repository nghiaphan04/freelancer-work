package com.workhub.api.entity;

public enum EDisputeStatus {
    PENDING_FREELANCER_RESPONSE,
    VOTING_ROUND_1,
    VOTING_ROUND_2,
    VOTING_ROUND_3,
    
    // Timeout - winner can claim via UI
    EVIDENCE_TIMEOUT,       // Freelancer không gửi evidence - employer có thể claim win
    
    // Resolved - winner can claim refund via UI
    EMPLOYER_WON,           // Employer thắng - chờ claim refund
    FREELANCER_WON,         // Freelancer thắng - chờ claim refund
    
    // Final - refund already claimed
    EMPLOYER_CLAIMED,       // Employer đã nhận tiền
    FREELANCER_CLAIMED,     // Freelancer đã nhận tiền
    
    CANCELLED
}
