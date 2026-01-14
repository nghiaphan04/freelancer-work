package com.workhub.api.service;

import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.JobNotFoundException;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;

/**
 * Service xử lý các chức năng CRUD cơ bản cho Job
 */
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final UserService userService;

    private static final BigDecimal FEE_PERCENT = new BigDecimal("5.00");

    // ===== CREATE =====

    @Transactional
    public ApiResponse<JobResponse> createJob(Long employerId, CreateJobRequest req) {
        User employer = userService.getById(employerId);

        if (!employer.hasBankInfo()) {
            throw new IllegalStateException("Vui lòng cập nhật số tài khoản ngân hàng trong profile trước khi đăng tin tuyển dụng");
        }

        if (req.getBudget() == null || req.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Job cần khai báo ngân sách hợp lệ");
        }

        BigDecimal budget = req.getBudget();
        BigDecimal feeAmount = budget.multiply(FEE_PERCENT).divide(new BigDecimal("100"), 0, RoundingMode.CEILING);
        BigDecimal total = budget.add(feeAmount);

        if (!employer.hasEnoughBalance(total)) {
            throw new IllegalStateException("Không đủ số dư để đăng job. Cần " + total.toPlainString() + " VND (gồm phí 5%).");
        }

        int submissionDays = req.getSubmissionDays() != null && req.getSubmissionDays() >= 1
                ? req.getSubmissionDays()
                : 1;
        int reviewDays = req.getReviewDays() != null && req.getReviewDays() >= 2
                ? req.getReviewDays()
                : 2;

        Job job = Job.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .context(req.getContext())
                .requirements(req.getRequirements())
                .deliverables(req.getDeliverables())
                .skills(req.getSkills() != null ? req.getSkills() : new HashSet<>())
                .complexity(req.getComplexity() != null ? req.getComplexity() : EJobComplexity.INTERMEDIATE)
                .duration(req.getDuration() != null ? req.getDuration() : EJobDuration.SHORT_TERM)
                .workType(req.getWorkType() != null ? req.getWorkType() : EWorkType.PART_TIME)
                .budget(req.getBudget())
                .escrowAmount(total)  // Lưu số tiền đã giữ (budget + fee)
                .currency(req.getCurrency() != null ? req.getCurrency() : "VND")
                .applicationDeadline(req.getApplicationDeadline())
                .submissionDays(submissionDays)
                .reviewDays(reviewDays)
                .status(EJobStatus.PENDING_APPROVAL)  // Chờ admin duyệt
                .employer(employer)
                .build();

        employer.deductBalance(total);
        userService.save(employer);

        Job savedJob = jobRepository.save(job);

        return ApiResponse.success("Tạo job thành công, đang chờ admin duyệt", buildJobResponse(savedJob));
    }

    // ===== READ =====

    public ApiResponse<JobResponse> getJobById(Long jobId) {
        Job job = getById(jobId);
        return ApiResponse.success("Thành công", buildJobResponse(job));
    }

    public ApiResponse<JobResponse> getJobByIdAndIncrementView(Long jobId) {
        Job job = getById(jobId);
        job.incrementViewCount();
        jobRepository.save(job);
        return ApiResponse.success("Thành công", buildJobResponse(job));
    }

    public ApiResponse<Page<JobResponse>> getOpenJobs(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Job> jobs = jobRepository.findByStatus(EJobStatus.OPEN, pageable);
        Page<JobResponse> response = jobs.map(this::buildJobResponse);

        return ApiResponse.success("Thành công", response);
    }

    public ApiResponse<Page<JobResponse>> getMyJobs(Long employerId, EJobStatus status, 
                                                     int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Job> jobs;
        if (status != null) {
            jobs = jobRepository.findByEmployerIdAndStatus(employerId, status, pageable);
        } else {
            jobs = jobRepository.findByEmployerId(employerId, pageable);
        }

        Page<JobResponse> response = jobs.map(this::buildJobResponse);
        return ApiResponse.success("Thành công", response);
    }

    /**
     * Lấy danh sách jobs đang làm của freelancer (jobs có application ACCEPTED)
     * Bao gồm thông tin work submission
     */
    public ApiResponse<Page<JobResponse>> getFreelancerWorkingJobs(Long freelancerId, EJobStatus status,
                                                                    int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Job> jobs;
        if (status != null) {
            jobs = jobRepository.findByStatusAndAcceptedFreelancerId(status, freelancerId, pageable);
        } else {
            jobs = jobRepository.findByAcceptedFreelancerId(freelancerId, pageable);
        }

        // Build response với work submission info
        Page<JobResponse> response = jobs.map(job -> buildJobResponseWithWorkInfo(job, freelancerId));
        return ApiResponse.success("Thành công", response);
    }

    /**
     * Lấy thống kê jobs của freelancer
     */
    public ApiResponse<FreelancerJobStats> getFreelancerJobStats(Long freelancerId) {
        long inProgress = jobRepository.countByStatusAndAcceptedFreelancerId(EJobStatus.IN_PROGRESS, freelancerId);
        long completed = jobRepository.countByStatusAndAcceptedFreelancerId(EJobStatus.COMPLETED, freelancerId);
        long disputed = jobRepository.countByStatusAndAcceptedFreelancerId(EJobStatus.DISPUTED, freelancerId);
        long totalEarnings = jobRepository.sumEarningsByAcceptedFreelancerId(freelancerId);

        FreelancerJobStats stats = new FreelancerJobStats(inProgress, completed, disputed, totalEarnings);
        return ApiResponse.success("Thành công", stats);
    }

    public record FreelancerJobStats(long inProgress, long completed, long disputed, long totalEarnings) {}

    public ApiResponse<Page<JobResponse>> searchJobs(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Job> jobs = jobRepository.searchJobs(keyword, EJobStatus.OPEN, pageable);
        Page<JobResponse> response = jobs.map(this::buildJobResponse);
        return ApiResponse.success("Thành công", response);
    }

    public ApiResponse<Page<JobResponse>> getJobsBySkills(List<String> skills, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Job> jobs = jobRepository.findBySkillsAndStatus(skills, EJobStatus.OPEN, pageable);
        Page<JobResponse> response = jobs.map(this::buildJobResponse);
        return ApiResponse.success("Thành công", response);
    }

    // ===== UPDATE =====

    @Transactional
    public ApiResponse<JobResponse> updateJob(Long jobId, Long userId, UpdateJobRequest req) {
        Job job = getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền sửa job này");
        }

        if (job.getStatus() != EJobStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể chỉnh sửa job ở trạng thái Bản nháp. Vui lòng chuyển về Bản nháp trước khi chỉnh sửa.");
        }

        if (job.getApplicationCount() > 0) {
            throw new IllegalStateException("Không thể chỉnh sửa job đã có người ứng tuyển");
        }

        boolean hasAcceptedApplication = jobApplicationRepository.existsByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED);
        if (hasAcceptedApplication) {
            throw new IllegalStateException("Không thể chỉnh sửa job đã có người làm tham gia");
        }

        job.update(
                req.getTitle(),
                req.getDescription(),
                req.getContext(),
                req.getRequirements(),
                req.getDeliverables(),
                req.getSkills(),
                req.getComplexity(),
                req.getDuration(),
                req.getWorkType(),
                req.getBudget(),
                req.getCurrency(),
                req.getApplicationDeadline(),
                req.getSubmissionDays(),
                req.getReviewDays()
        );

        Job updatedJob = jobRepository.save(job);
        return ApiResponse.success("Cập nhật job thành công", buildJobResponse(updatedJob));
    }

    @Transactional
    public ApiResponse<JobResponse> closeJob(Long jobId, Long userId) {
        Job job = getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền đóng job này");
        }

        job.close();
        Job updatedJob = jobRepository.save(job);

        return ApiResponse.success("Đã đóng tin tuyển dụng", buildJobResponse(updatedJob));
    }

    @Transactional
    public ApiResponse<JobResponse> toggleJobStatus(Long jobId, Long userId) {
        Job job = getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền thay đổi trạng thái job này");
        }

        // Toggle giữa DRAFT và OPEN
        if (job.getStatus() == EJobStatus.DRAFT) {
            job.setStatus(EJobStatus.OPEN);
        } else if (job.getStatus() == EJobStatus.OPEN) {
            if (job.getApplicationCount() > 0) {
                throw new IllegalStateException("Không thể chuyển về Bản nháp khi đã có người ứng tuyển");
            }
            boolean hasAcceptedApplication = jobApplicationRepository.existsByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED);
            if (hasAcceptedApplication) {
                throw new IllegalStateException("Không thể chuyển về Bản nháp khi đã có người làm tham gia");
            }
            job.setStatus(EJobStatus.DRAFT);
        } else {
            throw new IllegalStateException("Chỉ có thể chuyển đổi giữa trạng thái Nháp và Công khai");
        }

        Job updatedJob = jobRepository.save(job);
        String message = updatedJob.getStatus() == EJobStatus.OPEN 
                ? "Đã đăng tin công khai" 
                : "Đã chuyển về bản nháp";
        
        return ApiResponse.success(message, buildJobResponse(updatedJob));
    }

    // ===== DELETE =====

    @Transactional
    public ApiResponse<Void> deleteJob(Long jobId, Long userId) {
        Job job = getById(jobId);
        User user = userService.getById(userId);

        if (!job.isOwnedBy(userId) && !user.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa job này");
        }

        EJobStatus status = job.getStatus();
        boolean canDelete = status == EJobStatus.DRAFT 
                || status == EJobStatus.PENDING_APPROVAL 
                || status == EJobStatus.REJECTED;
        
        if (!canDelete) {
            throw new IllegalStateException("Chỉ có thể xóa job ở trạng thái Bản nháp, Chờ duyệt hoặc Bị từ chối");
        }

        if (job.getApplicationCount() > 0) {
            throw new IllegalStateException("Không thể xóa job đã có người ứng tuyển");
        }

        // Hoàn tiền escrow cho employer nếu có
        // DRAFT và PENDING_APPROVAL vẫn giữ escrow, cần hoàn lại
        // REJECTED đã được hoàn trong rejectJob rồi
        if ((status == EJobStatus.DRAFT || status == EJobStatus.PENDING_APPROVAL) 
                && job.getEscrowAmount() != null 
                && job.getEscrowAmount().compareTo(BigDecimal.ZERO) > 0) {
            User employer = job.getEmployer();
            employer.addBalance(job.getEscrowAmount());
            userService.save(employer);
        }

        jobRepository.delete(job);
        
        return ApiResponse.success("Xóa job thành công");
    }

    // ===== UTILITY =====

    public Job getById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException(id));
    }

    /**
     * Kiểm tra quyền xem lịch sử job
     * - Employer của job
     * - Freelancer đã được accept vào job
     * - Admin
     */
    public void validateHistoryAccess(Long jobId, Long userId) {
        Job job = getById(jobId);
        User user = userService.getById(userId);

        if (user.isAdmin()) {
            return;
        }

        if (job.isOwnedBy(userId)) {
            return;
        }

        boolean isAcceptedFreelancer = jobApplicationRepository
                .existsByJobIdAndFreelancerIdAndStatus(jobId, userId, EApplicationStatus.ACCEPTED);
        if (isAcceptedFreelancer) {
            return;
        }

        throw new UnauthorizedAccessException("Bạn không có quyền xem lịch sử công việc này");
    }

    /**
     * Build response từ Job entity (public để các service khác có thể dùng)
     */
    public JobResponse buildJobResponse(Job job) {
        User employer = job.getEmployer();
        
        JobResponse.EmployerResponse employerResponse = JobResponse.EmployerResponse.builder()
                .id(employer.getId())
                .fullName(employer.getFullName())
                .avatarUrl(employer.getAvatarUrl())
                .title(employer.getTitle())
                .company(employer.getCompany())
                .location(employer.getLocation())
                .isVerified(employer.getIsVerified())
                .trustScore(employer.getTrustScore())
                .untrustScore(employer.getUntrustScore())
                .build();

        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .context(job.getContext())
                .requirements(job.getRequirements())
                .deliverables(job.getDeliverables())
                .skills(job.getSkills())
                .complexity(job.getComplexity())
                .duration(job.getDuration())
                .workType(job.getWorkType())
                .budget(job.getBudget())
                .escrowAmount(job.getEscrowAmount())
                .currency(job.getCurrency())
                .applicationDeadline(job.getApplicationDeadline())
                .submissionDays(job.getSubmissionDays())
                .reviewDays(job.getReviewDays())
                .status(job.getStatus())
                .rejectionReason(job.getRejectionReason())
                .workSubmissionDeadline(job.getWorkSubmissionDeadline())
                .workReviewDeadline(job.getWorkReviewDeadline())
                .viewCount(job.getViewCount())
                .applicationCount(job.getApplicationCount())
                .employer(employerResponse)
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    /**
     * Build response với work submission info (cho freelancer's working jobs)
     */
    public JobResponse buildJobResponseWithWorkInfo(Job job, Long freelancerId) {
        JobResponse response = buildJobResponse(job);
        
        // Lấy application của freelancer cho job này
        jobApplicationRepository.findByJobIdAndFreelancerId(job.getId(), freelancerId)
                .ifPresent(application -> {
                    response.setWorkStatus(application.getWorkStatus());
                    response.setWorkSubmissionUrl(application.getWorkSubmissionUrl());
                    response.setWorkSubmissionNote(application.getWorkSubmissionNote());
                    response.setWorkSubmittedAt(application.getWorkSubmittedAt());
                });
        
        return response;
    }
}
