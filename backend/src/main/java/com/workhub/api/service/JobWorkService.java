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

/**
 * Service xử lý nộp và duyệt sản phẩm công việc
 */
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

    /**
     * Freelancer nộp sản phẩm
     */
    @Transactional
    public ApiResponse<JobApplicationResponse> submitWork(Long jobId, Long userId, String url, String note, Long fileId) {
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

        // Submit work
        application.submitWork(url, note);
        jobApplicationRepository.save(application);

        int reviewDays = job.getReviewDays() != null && job.getReviewDays() >= 2
                ? job.getReviewDays()
                : 2;
        // Clear submission deadline và set review deadline
        job.setWorkSubmissionDeadline(null);
        job.setWorkReviewDeadline(java.time.LocalDateTime.now().plusDays(reviewDays));
        jobRepository.save(job);

        if (fileId != null) {
            fileUploadService.assignFileToReference(fileId, "JOB_WORK_SUBMISSION", job.getId());
        }

        // Ghi lịch sử
        User freelancer = userService.getById(userId);
        String description = "Đã nộp sản phẩm";
        String metadata = fileId != null ? fileId.toString() : null;
        jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.WORK_SUBMITTED, description, metadata);

        // Thông báo cho employer
        notificationService.notifyWorkSubmitted(job.getEmployer(), job, freelancer);

        return ApiResponse.success("Đã nộp sản phẩm thành công", jobApplicationService.buildApplicationResponse(application));
    }

    /**
     * Employer duyệt sản phẩm → Thanh toán cho freelancer + Cả 2 được +1 điểm uy tín
     */
    @Transactional
    public ApiResponse<JobApplicationResponse> approveWork(Long jobId, Long userId) {
        Job job = jobService.getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        JobApplication application = jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy freelancer đang làm"));

        if (!application.isWorkSubmitted()) {
            throw new IllegalStateException("Freelancer chưa nộp sản phẩm");
        }

        // Approve work
        application.approveWork();
        jobApplicationRepository.save(application);

        // Complete job và clear deadlines
        job.complete();
        job.clearDeadlines();
        jobRepository.save(job);

        // Thanh toán escrow cho freelancer (budget, không bao gồm fee)
        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        BigDecimal payment = job.getBudget();
        
        if (payment != null && payment.compareTo(BigDecimal.ZERO) > 0) {
            freelancer.addBalance(payment);
            userService.save(freelancer);
        }

        // Cộng điểm uy tín cho cả 2 bên
        freelancer.addTrustScore(1);
        employer.addTrustScore(1);
        userService.save(freelancer);
        userService.save(employer);

        // Ghi lịch sử
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.WORK_APPROVED,
                "Đã duyệt sản phẩm của " + freelancer.getFullName());
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.PAYMENT_RELEASED,
                "Đã thanh toán " + payment.toPlainString() + " VND cho freelancer");
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.JOB_COMPLETED,
                "Công việc hoàn thành thành công");

        // Thông báo cho freelancer
        notificationService.notifyWorkApproved(freelancer, job);
        notificationService.notifyPaymentReleased(freelancer, job, payment.toPlainString());
        
        // Thông báo hoàn thành cho cả 2 bên
        notificationService.notifyJobCompleted(freelancer, job);
        notificationService.notifyJobCompleted(employer, job);

        return ApiResponse.success(
                "Đã duyệt sản phẩm và thanh toán " + payment.toPlainString() + " VND cho freelancer. Cả 2 bên đã được +1 điểm uy tín.",
                jobApplicationService.buildApplicationResponse(application));
    }

    /**
     * Employer yêu cầu chỉnh sửa
     */
    @Transactional
    public ApiResponse<JobApplicationResponse> requestRevision(Long jobId, Long userId, String note) {
        Job job = jobService.getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        JobApplication application = jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy freelancer đang làm"));

        if (!application.isWorkSubmitted()) {
            throw new IllegalStateException("Freelancer chưa nộp sản phẩm");
        }

        // Request revision
        application.requestRevision(note);
        jobApplicationRepository.save(application);

        // Clear review deadline, set new submission deadline (thêm 3 ngày để sửa)
        job.setWorkReviewDeadline(null);
        job.setWorkSubmissionDeadline(java.time.LocalDateTime.now().plusDays(3));
        jobRepository.save(job);

        // Ghi lịch sử
        User employer = userService.getById(userId);
        User freelancer = application.getFreelancer();
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.WORK_REJECTED,
                "Yêu cầu chỉnh sửa: " + note);

        // Thông báo cho freelancer
        notificationService.notifyWorkRevisionRequested(freelancer, job, note);

        return ApiResponse.success("Đã yêu cầu freelancer chỉnh sửa sản phẩm", jobApplicationService.buildApplicationResponse(application));
    }

    /**
     * Lấy thông tin work submission của job
     */
    public ApiResponse<JobApplicationResponse> getWorkSubmission(Long jobId, Long userId) {
        Job job = jobService.getById(jobId);

        // Kiểm tra quyền xem (employer hoặc freelancer của job)
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
