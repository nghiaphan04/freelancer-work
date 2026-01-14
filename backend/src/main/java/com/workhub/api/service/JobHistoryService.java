package com.workhub.api.service;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobHistoryResponse;
import com.workhub.api.entity.*;
import com.workhub.api.repository.FileUploadRepository;
import com.workhub.api.repository.JobHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobHistoryService {

    private final JobHistoryRepository jobHistoryRepository;
    private final FileUploadRepository fileUploadRepository;

    @Transactional
    public void logHistory(Job job, User user, EJobHistoryAction action, String description) {
        logHistory(job, user, action, description, null);
    }

    @Transactional
    public void logHistory(Job job, User user, EJobHistoryAction action, String description, String metadata) {
        JobHistory history = JobHistory.builder()
                .job(job)
                .user(user)
                .action(action)
                .description(description)
                .metadata(metadata)
                .build();
        jobHistoryRepository.save(history);
    }

    public ApiResponse<List<JobHistoryResponse>> getJobHistory(Long jobId) {
        List<JobHistory> histories = jobHistoryRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        List<JobHistoryResponse> responses = histories.stream()
                .map(this::buildResponse)
                .toList();
        return ApiResponse.success("Thành công", responses);
    }

    public ApiResponse<Page<JobHistoryResponse>> getJobHistoryPaged(Long jobId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<JobHistory> histories = jobHistoryRepository.findByJobId(jobId, pageable);
        Page<JobHistoryResponse> responses = histories.map(this::buildResponse);
        return ApiResponse.success("Thành công", responses);
    }

    private JobHistoryResponse buildResponse(JobHistory history) {
        User user = history.getUser();
        String role = "USER";
        if (user.isAdmin()) {
            role = "ADMIN";
        } else if (user.hasRole(ERole.ROLE_EMPLOYER)) {
            role = "EMPLOYER";
        } else if (user.hasRole(ERole.ROLE_FREELANCER)) {
            role = "FREELANCER";
        }

        return JobHistoryResponse.builder()
                .id(history.getId())
                .jobId(history.getJob().getId())
                .action(history.getAction())
                .actionLabel(JobHistoryResponse.getActionLabel(history.getAction()))
                .description(history.getDescription())
                .metadata(history.getMetadata())
                .user(JobHistoryResponse.UserInfo.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .avatarUrl(user.getAvatarUrl())
                        .role(role)
                        .build())
                .createdAt(history.getCreatedAt())
                .fileAttachment(resolveFileAttachment(history))
                .build();
    }

    private JobHistoryResponse.FileAttachment resolveFileAttachment(JobHistory history) {
        Long fileId = parseFileId(history.getMetadata());
        if (fileId == null) {
            return null;
        }

        return fileUploadRepository.findByIdAndIsDeletedFalse(fileId)
                .map(file -> JobHistoryResponse.FileAttachment.builder()
                        .id(file.getId())
                        .secureUrl(file.getSecureUrl())
                        .originalFilename(file.getOriginalFilename())
                        .readableSize(file.getReadableSize())
                        .build())
                .orElse(null);
    }

    private Long parseFileId(String metadata) {
        if (metadata == null) {
            return null;
        }
        try {
            return Long.parseLong(metadata);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
