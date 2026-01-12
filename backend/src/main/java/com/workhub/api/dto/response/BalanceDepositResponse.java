package com.workhub.api.dto.response;

import com.workhub.api.entity.EDepositStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceDepositResponse {

    private Long id;
    private String appTransId;
    private Long zpTransId;
    private Long userId;
    private String userFullName;
    private BigDecimal amount;
    private String description;
    private String orderUrl;
    private String qrCode;
    private String zpTransToken;
    private EDepositStatus status;
    private Integer paymentChannel;
    private LocalDateTime expiredAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
