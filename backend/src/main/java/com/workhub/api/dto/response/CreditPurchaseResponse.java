package com.workhub.api.dto.response;

import com.workhub.api.entity.ECreditPackage;
import com.workhub.api.entity.EPaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditPurchaseResponse {
    private Long id;
    private String appTransId;
    private Long zpTransId;
    private Long userId;
    private String userFullName;
    private ECreditPackage creditPackage;
    private Integer creditsAmount;
    private BigDecimal totalAmount;
    private String currency;
    private String description;
    private String orderUrl;
    private String qrCode;
    private EPaymentStatus status;
    private Integer paymentChannel;
    private Boolean creditsGranted;
    private LocalDateTime expiredAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
