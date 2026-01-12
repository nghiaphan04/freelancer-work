package com.workhub.api.dto.response;

import com.workhub.api.entity.EApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class JobApplicationResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private FreelancerResponse freelancer;
    private String coverLetter;
    private EApplicationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class FreelancerResponse {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private String phoneNumber;
        private String bio;
        private Set<String> skills;
    }
}
