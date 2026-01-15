package com.workhub.api.dto.response;

import com.workhub.api.entity.EJobComplexity;
import com.workhub.api.entity.EJobDuration;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.entity.EWorkStatus;
import com.workhub.api.entity.EWorkType;
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
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private String context;
    private String requirements;
    private String deliverables;
    private Set<String> skills;
    private EJobComplexity complexity;
    private EJobDuration duration;
    private EWorkType workType;
    private BigDecimal budget;
    private BigDecimal escrowAmount;  // Số tiền đã giữ (budget + fee)
    private String currency;
    private LocalDateTime applicationDeadline;
    private Integer submissionDays;
    private Integer reviewDays;
    private EJobStatus status;
    private String rejectionReason;  // Lý do từ chối (nếu bị reject)
    private LocalDateTime workSubmissionDeadline;  // Hạn nộp sản phẩm
    private LocalDateTime workReviewDeadline;      // Hạn review sản phẩm
    private Integer viewCount;
    private Integer applicationCount;
    private EmployerResponse employer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Work submission info (for freelancer's view)
    private EWorkStatus workStatus;
    private String workSubmissionUrl;
    private String workSubmissionNote;
    private LocalDateTime workSubmittedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployerResponse {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private String title;
        private String company;
        private String location;
        private Boolean isVerified;
        private Integer trustScore;      // Điểm uy tín (UT)
        private Integer untrustScore;    // Điểm không uy tín (KUT)
    }
}
