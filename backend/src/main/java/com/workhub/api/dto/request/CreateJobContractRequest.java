package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateJobContractRequest {
    
    @NotNull(message = "Budget is required")
    @Positive(message = "Budget must be positive")
    private BigDecimal budget;
    
    private String currency = "APT";
    
    @NotNull(message = "Deadline days is required")
    @Positive(message = "Deadline days must be positive")
    private Integer deadlineDays;
    
    @NotNull(message = "Review days is required")
    @Positive(message = "Review days must be positive")
    private Integer reviewDays;
    
    @NotBlank(message = "Requirements is required")
    private String requirements;
    
    @NotBlank(message = "Deliverables is required")
    private String deliverables;
    
    private List<ContractTerm> terms; // Mảng các điều khoản tùy chỉnh
    
    private String contractHash;  // Hash từ frontend để đảm bảo khớp với blockchain
    
    @Data
    public static class ContractTerm {
        private String title;
        private String content;
    }
}
