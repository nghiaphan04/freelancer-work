package com.workhub.api.dto.response;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workhub.api.entity.JobContract;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@Builder
public class JobContractResponse {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    private Long id;
    private Long jobId;
    private BigDecimal budget;
    private String currency;
    private Integer deadlineDays;
    private Integer reviewDays;
    private String requirements;
    private String deliverables;
    private List<ContractTerm> terms;
    private String contractHash;
    private Boolean employerSigned;
    private LocalDateTime employerSignedAt;
    private Boolean freelancerSigned;
    private LocalDateTime freelancerSignedAt;
    private String freelancerSignatureTx;
    private LocalDateTime createdAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContractTerm {
        private String title;
        private String content;
    }
    
    public static JobContractResponse fromEntity(JobContract contract) {
        List<ContractTerm> terms = Collections.emptyList();
        if (contract.getTermsJson() != null && !contract.getTermsJson().isEmpty()) {
            try {
                terms = objectMapper.readValue(contract.getTermsJson(), new TypeReference<List<ContractTerm>>() {});
            } catch (Exception e) {
                // ignore parse error
            }
        }
        
        return JobContractResponse.builder()
                .id(contract.getId())
                .jobId(contract.getJob().getId())
                .budget(contract.getBudget())
                .currency(contract.getCurrency())
                .deadlineDays(contract.getDeadlineDays())
                .reviewDays(contract.getReviewDays())
                .requirements(contract.getRequirements())
                .deliverables(contract.getDeliverables())
                .terms(terms)
                .contractHash(contract.getContractHash())
                .employerSigned(contract.getEmployerSigned())
                .employerSignedAt(contract.getEmployerSignedAt())
                .freelancerSigned(contract.getFreelancerSigned())
                .freelancerSignedAt(contract.getFreelancerSignedAt())
                .freelancerSignatureTx(contract.getFreelancerSignatureTx())
                .createdAt(contract.getCreatedAt())
                .build();
    }
}
