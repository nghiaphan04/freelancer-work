package com.workhub.api.service;

import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.JobNotFoundException;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.JobRepository;
import com.workhub.api.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserService userService;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Transactional
    public ApiResponse<JobResponse> createJob(Long employerId, CreateJobRequest req) {
        User employer = userService.getById(employerId);

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
                .currency(req.getCurrency() != null ? req.getCurrency() : "VND")
                .applicationDeadline(req.getApplicationDeadline())
                .expectedStartDate(req.getExpectedStartDate())
                .status(EJobStatus.DRAFT)
                .employer(employer)
                .build();

        Job savedJob = jobRepository.save(job);

        return ApiResponse.success("Tạo job thành công. Vui lòng thanh toán để đăng tin.", buildJobResponse(savedJob));
    }

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

    @Transactional
    public ApiResponse<JobResponse> updateJob(Long jobId, Long userId, UpdateJobRequest req) {
        Job job = getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền sửa job này");
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
                req.getExpectedStartDate()
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
        
        boolean hasRefundablePayment = paymentRepository.findByJobIdAndStatus(jobId, EPaymentStatus.PAID)
                .map(p -> p.canRefund())
                .orElse(false);
        
        String message = hasRefundablePayment 
                ? "Đã đóng tin. Gọi API hoàn tiền để nhận lại tiền escrow."
                : "Đã đóng tin tuyển dụng";
        
        return ApiResponse.success(message, buildJobResponse(updatedJob));
    }

    @Transactional
    public ApiResponse<JobResponse> toggleJobStatus(Long jobId, Long userId) {
        Job job = getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền thay đổi trạng thái job này");
        }

        // Kiểm tra đã thanh toán chưa
        Payment payment = paymentRepository.findByJobIdAndStatus(jobId, EPaymentStatus.PAID).orElse(null);
        if (payment == null) {
            throw new IllegalStateException("Vui lòng thanh toán trước khi đăng tin");
        }

        // Toggle giữa DRAFT và OPEN
        if (job.getStatus() == EJobStatus.DRAFT) {
            job.setStatus(EJobStatus.OPEN);
        } else if (job.getStatus() == EJobStatus.OPEN) {
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

    @Transactional
    public ApiResponse<Void> deleteJob(Long jobId, Long userId) {
        Job job = getById(jobId);
        User user = userService.getById(userId);

        if (!job.isOwnedBy(userId) && !user.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa job này");
        }

        boolean refunded = false;
        List<Payment> payments = paymentRepository.findByJobId(jobId);
        
        for (Payment payment : payments) {
            if (payment.getStatus() == EPaymentStatus.PAID && !payment.isRefunded()) {
                paymentService.refundPayment(jobId, userId, "Xóa job - tự động hoàn tiền");
                refunded = true;
            }
        }
        // Xóa tất cả payments liên quan
        paymentRepository.deleteAll(payments);

        jobRepository.delete(job);
        
        String message = refunded 
            ? "Xóa job thành công (đã hoàn tiền escrow)" 
            : "Xóa job thành công";
        return ApiResponse.success(message);
    }

    public Job getById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException(id));
    }

    private JobResponse buildJobResponse(Job job) {
        User employer = job.getEmployer();
        
        JobResponse.EmployerResponse employerResponse = JobResponse.EmployerResponse.builder()
                .id(employer.getId())
                .fullName(employer.getFullName())
                .avatarUrl(employer.getAvatarUrl())
                .title(employer.getTitle())
                .company(employer.getCompany())
                .location(employer.getLocation())
                .isVerified(employer.getIsVerified())
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
                .currency(job.getCurrency())
                .applicationDeadline(job.getApplicationDeadline())
                .expectedStartDate(job.getExpectedStartDate())
                .status(job.getStatus())
                .viewCount(job.getViewCount())
                .applicationCount(job.getApplicationCount())
                .employer(employerResponse)
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
