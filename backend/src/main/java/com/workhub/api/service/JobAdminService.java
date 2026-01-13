package com.workhub.api.service;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.*;
import com.workhub.api.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Service xử lý các chức năng Admin duyệt/từ chối Job
 */
@Service
@RequiredArgsConstructor
public class JobAdminService {

    private final JobRepository jobRepository;
    private final JobService jobService;
    private final UserService userService;
    private final NotificationService notificationService;

    /**
     * [ADMIN] Lấy danh sách jobs chờ duyệt
     */
    public ApiResponse<Page<JobResponse>> getPendingJobs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Job> jobs = jobRepository.findByStatusWithEmployer(EJobStatus.PENDING_APPROVAL, pageable);
        Page<JobResponse> response = jobs.map(jobService::buildJobResponse);
        return ApiResponse.success("Lấy danh sách jobs chờ duyệt thành công", response);
    }

    /**
     * [ADMIN] Lấy tất cả jobs theo status
     */
    public ApiResponse<Page<JobResponse>> getJobsByStatus(EJobStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Job> jobs = jobRepository.findByStatusWithEmployer(status, pageable);
        Page<JobResponse> response = jobs.map(jobService::buildJobResponse);
        return ApiResponse.success("Thành công", response);
    }

    /**
     * [ADMIN] Duyệt job
     */
    @Transactional
    public ApiResponse<JobResponse> approveJob(Long jobId) {
        Job job = jobService.getById(jobId);

        if (!job.isPendingApproval()) {
            return ApiResponse.error("Job không ở trạng thái chờ duyệt");
        }

        job.approve();
        Job updatedJob = jobRepository.save(job);

        // Gửi thông báo cho employer
        notificationService.notifyJobApproved(job.getEmployer(), job);

        return ApiResponse.success("Đã duyệt job thành công", jobService.buildJobResponse(updatedJob));
    }

    /**
     * [ADMIN] Từ chối job - hoàn tiền escrow cho employer
     */
    @Transactional
    public ApiResponse<JobResponse> rejectJob(Long jobId, String reason) {
        Job job = jobService.getById(jobId);

        if (!job.isPendingApproval()) {
            return ApiResponse.error("Job không ở trạng thái chờ duyệt");
        }

        // Hoàn tiền escrow cho employer
        User employer = job.getEmployer();
        BigDecimal escrowAmount = job.getEscrowAmount();
        if (escrowAmount != null && escrowAmount.compareTo(BigDecimal.ZERO) > 0) {
            employer.addBalance(escrowAmount);
            userService.save(employer);
        }

        job.reject(reason);
        Job updatedJob = jobRepository.save(job);

        // Gửi thông báo cho employer
        notificationService.notifyJobRejected(employer, job, reason);

        String message = escrowAmount != null
                ? "Đã từ chối job và hoàn " + escrowAmount.toPlainString() + " VND cho employer"
                : "Đã từ chối job";

        return ApiResponse.success(message, jobService.buildJobResponse(updatedJob));
    }

    /**
     * [ADMIN] Đếm số jobs chờ duyệt
     */
    public ApiResponse<Long> countPendingJobs() {
        long count = jobRepository.countByStatus(EJobStatus.PENDING_APPROVAL);
        return ApiResponse.success("Thành công", count);
    }
}
