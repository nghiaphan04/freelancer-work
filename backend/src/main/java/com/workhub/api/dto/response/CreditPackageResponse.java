package com.workhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CreditPackageResponse {
    private String packageId;
    private int credits;
    private BigDecimal price;
    private BigDecimal pricePerCredit;
    private BigDecimal originalPrice;
    private int discountPercent;
    private String description;
}
