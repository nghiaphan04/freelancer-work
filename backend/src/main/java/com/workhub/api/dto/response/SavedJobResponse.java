package com.workhub.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedJobResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String jobDescription;
    private BigDecimal jobBudget;
    private String jobStatus;
    private Set<String> jobSkills;
    private EmployerInfo employer;
    private LocalDateTime savedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployerInfo {
        private Long id;
        private String fullName;
        private String company;
        private String location;
        private String avatarUrl;
    }
}
