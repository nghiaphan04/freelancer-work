package com.workhub.api.dto.response;

import com.workhub.api.entity.EApplicationStatus;
import com.workhub.api.entity.EWorkStatus;
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
    
    // Work submission fields
    private EWorkStatus workStatus;
    private String workStatusLabel;
    private String workSubmissionUrl;
    private String workSubmissionNote;
    private LocalDateTime workSubmittedAt;
    private String workRevisionNote;
    
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
        private Integer trustScore;      // Điểm uy tín (UT)
        private Integer untrustScore;    // Điểm không uy tín (KUT)
    }

    public static String getWorkStatusLabel(EWorkStatus workStatus) {
        if (workStatus == null) return null;
        return switch (workStatus) {
            case NOT_STARTED -> "Chưa bắt đầu";
            case IN_PROGRESS -> "Đang làm";
            case SUBMITTED -> "Đã nộp";
            case REVISION_REQUESTED -> "Yêu cầu chỉnh sửa";
            case APPROVED -> "Đã duyệt";
        };
    }
}
