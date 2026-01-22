package com.workhub.api.service;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class JobWorkService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobService jobService;
    private final JobApplicationService jobApplicationService;
    private final UserService userService;
    private final JobHistoryService jobHistoryService;
    private final NotificationService notificationService;
    private final FileUploadService fileUploadService;

    @Transactional
    public ApiResponse<JobApplicationResponse> submitWork(Long jobId, Long userId, String url, String note, Long fileId, String txHash) {
        JobApplication application = jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển được chấp nhận"));

        if (!application.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải freelancer của công việc này");
        }

        Job job = application.getJob();
        if (job.getStatus() != EJobStatus.IN_PROGRESS) {
            throw new IllegalStateException("Công việc không ở trạng thái đang thực hiện");
        }

        if (!application.canSubmitWork()) {
            throw new IllegalStateException("Không thể nộp sản phẩm ở trạng thái hiện tại");
        }

        if (job.getEscrowId() != null && (txHash == null || txHash.isBlank())) {
            throw new IllegalStateException("Cần xác nhận từ blockchain");
        }

        application.submitWork(url, note);
        jobApplicationRepository.save(application);

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        // FOR TESTING: Use MINUTES instead of days (change back to plusDays for production)
        int reviewMinutes = job.getReviewDays() != null && job.getReviewDays() >= 1
                ? job.getReviewDays()
                : 2;
        job.setWorkSubmissionDeadline(null);
        job.setWorkSubmittedAt(now);
        job.setWorkReviewDeadline(now.plusMinutes(reviewMinutes));
        jobRepository.save(job);

        if (fileId != null) {
            fileUploadService.assignFileToReference(fileId, "JOB_WORK_SUBMISSION", job.getId());
        }

        User freelancer = userService.getById(userId);
        String description = "Đã nộp sản phẩm";
        String metadata = fileId != null ? fileId.toString() : null;
        jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.WORK_SUBMITTED, description, metadata);

        notificationService.notifyWorkSubmitted(job.getEmployer(), job, freelancer);

        return ApiResponse.success("Đã nộp sản phẩm thành công", jobApplicationService.buildApplicationResponse(application));
    }

    @Transactional
    public ApiResponse<JobApplicationResponse> approveWork(Long jobId, Long userId, String txHash) {
        Job job = jobService.getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        JobApplication application = jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy freelancer đang làm"));

        if (!application.isWorkSubmitted()) {
            throw new IllegalStateException("Freelancer chưa nộp sản phẩm");
        }

        application.approveWork();
        jobApplicationRepository.save(application);

        job.complete();
        job.clearDeadlines();
        
        if (txHash != null && !txHash.isBlank()) {
            job.setPaymentTxHash(txHash);
        }
        jobRepository.save(job);

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        BigDecimal payment = job.getBudget();


        jobHistoryService.logHistory(job, employer, EJobHistoryAction.WORK_APPROVED,
                "Đã duyệt sản phẩm của " + freelancer.getFullName());
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.PAYMENT_RELEASED,
                "Đã thanh toán " + payment.toPlainString() + " " + job.getCurrency());
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.JOB_COMPLETED,
                "Công việc hoàn thành thành công");

        notificationService.notifyWorkApproved(freelancer, job);
        notificationService.notifyPaymentReleased(freelancer, job, payment.toPlainString() + " " + job.getCurrency());
        notificationService.notifyJobCompleted(freelancer, job);
        notificationService.notifyJobCompleted(employer, job);

        return ApiResponse.success(
                "Đã duyệt sản phẩm và thanh toán " + payment.toPlainString() + " " + job.getCurrency(),
                jobApplicationService.buildApplicationResponse(application));
    }

    @Transactional
    public ApiResponse<JobApplicationResponse> requestRevision(Long jobId, Long userId, String note, String txHash) {
        Job job = jobService.getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        if (job.getEscrowId() != null && (txHash == null || txHash.isBlank())) {
            throw new IllegalStateException("Cần xác nhận từ blockchain");
        }

        JobApplication application = jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy freelancer đang làm"));

        if (!application.isWorkSubmitted()) {
            throw new IllegalStateException("Freelancer chưa nộp sản phẩm");
        }

        application.requestRevision(note);
        jobApplicationRepository.save(application);

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        // FOR TESTING: Use MINUTES instead of days (change back to plusDays for production)
        int submissionMinutes = job.getSubmissionDays() != null && job.getSubmissionDays() >= 1
                ? job.getSubmissionDays()
                : 2;
        job.setWorkReviewDeadline(null);
        job.setWorkSubmittedAt(null);
        job.setWorkSubmissionDeadline(now.plusMinutes(submissionMinutes));
        jobRepository.save(job);

        User employer = userService.getById(userId);
        User freelancer = application.getFreelancer();
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.WORK_REJECTED,
                "Yêu cầu chỉnh sửa: " + note);

        notificationService.notifyWorkRevisionRequested(freelancer, job, note);

        return ApiResponse.success("Đã yêu cầu freelancer chỉnh sửa sản phẩm", jobApplicationService.buildApplicationResponse(application));
    }

    public ApiResponse<JobApplicationResponse> getWorkSubmission(Long jobId, Long userId) {
        Job job = jobService.getById(jobId);

        boolean isEmployer = job.isOwnedBy(userId);
        boolean isFreelancer = jobApplicationRepository.existsByJobIdAndFreelancerIdAndStatus(jobId, userId, EApplicationStatus.ACCEPTED);

        if (!isEmployer && !isFreelancer) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin này");
        }

        JobApplication application = jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElse(null);

        if (application == null) {
            return ApiResponse.success("Chưa có freelancer được chấp nhận", null);
        }

        return ApiResponse.success("Thành công", jobApplicationService.buildApplicationResponse(application));
    }
}
