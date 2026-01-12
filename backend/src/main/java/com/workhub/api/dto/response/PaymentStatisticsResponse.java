package com.workhub.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatisticsResponse {
    
    private BigDecimal totalRevenue;
    private BigDecimal totalEscrowAmount;
    private BigDecimal totalFeeAmount;
    
    private Long totalTransactions;
    private Long paidTransactions;
    private Long pendingTransactions;
    private Long cancelledTransactions;
    private Long expiredTransactions;
    
    private BigDecimal todayRevenue;
    private Long todayTransactions;
    
    private BigDecimal monthRevenue;
    private Long monthTransactions;
}
