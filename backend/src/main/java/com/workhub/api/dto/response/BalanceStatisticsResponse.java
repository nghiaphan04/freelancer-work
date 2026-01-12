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
public class BalanceStatisticsResponse {

    private BigDecimal totalDeposited;

    private Long totalTransactions;
    private Long paidTransactions;
    private Long pendingTransactions;
    private Long cancelledTransactions;
    private Long expiredTransactions;

    private BigDecimal todayDeposited;
    private Long todayTransactions;

    private BigDecimal monthDeposited;
    private Long monthTransactions;
}
