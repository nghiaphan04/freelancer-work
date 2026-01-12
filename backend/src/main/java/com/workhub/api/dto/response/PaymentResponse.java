package com.workhub.api.dto.response;

import com.workhub.api.entity.EPaymentStatus;
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
public class PaymentResponse {

    private Long id;
    
    private String appTransId;
    
    private Long zpTransId;
    
    private Long jobId;
    private String jobTitle;
    private BigDecimal jobAmount;
    private BigDecimal feeAmount;
    private BigDecimal feePercent;
    private BigDecimal totalAmount;
    private String currency;
    private String description;
    
    private String orderUrl;
    
    private String qrCode;
    
    private EPaymentStatus status;
    
    private Integer paymentChannel;
    
    private LocalDateTime expiredAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
