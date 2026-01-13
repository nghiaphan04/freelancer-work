package com.workhub.api.service;

import com.workhub.api.dto.request.ApplyJobRequest;
import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
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

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final UserService userService;

    private static final BigDecimal FEE_PERCENT = new BigDecimal("5.00");

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
                .status(EJobStatus.OPEN)
                .employer(employer)
                .build();

        employer.deductBalance(total);
        userService.save(employer);

        Job savedJob = jobRepository.save(job);

        return ApiResponse.success("Tạo job thành công và đã trừ số dư (gồm phí 5%)", buildJobResponse(savedJob));
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

        jobRepository.delete(job);
        
        return ApiResponse.success("Xóa job thành công");
    }

    public Job getById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException(id));
    }


    @Transactional
    public ApiResponse<JobApplicationResponse> applyJob(Long jobId, Long userId, ApplyJobRequest req) {
        User user = userService.getById(userId);
        Job job = getById(jobId);

        if (!user.hasRole(ERole.ROLE_FREELANCER)) {
            throw new UnauthorizedAccessException("Chỉ Freelancer mới có thể ứng tuyển");
        }

        if (job.isOwnedBy(userId)) {
            throw new IllegalStateException("Không thể ứng tuyển vào công việc do chính bạn đăng");
        }

        if (!job.isOpen()) {
            throw new IllegalStateException("Công việc không còn mở tuyển");
        }

        // Kiểm tra đã có đơn chưa
        JobApplication existingApplication = jobApplicationRepository.findByJobIdAndFreelancerId(jobId, userId).orElse(null);
        
        if (existingApplication != null && !existingApplication.isWithdrawn()) {
            throw new IllegalStateException("Bạn đã ứng tuyển vào công việc này rồi");
        }

        if (!user.hasBankInfo()) {
            throw new IllegalStateException("Vui lòng cập nhật thông tin tài khoản ngân hàng trong hồ sơ trước khi ứng tuyển");
        }

        if (!user.hasEnoughCredits(1)) {
            throw new IllegalStateException("Không đủ credit. Vui lòng mua thêm credit để ứng tuyển.");
        }

        user.deductCredits(1);
        userService.save(user);

        JobApplication saved;
        if (existingApplication != null && existingApplication.isWithdrawn()) {
            // Re-apply: cập nhật đơn cũ
            existingApplication.reapply(req != null ? req.getCoverLetter() : null);
            saved = jobApplicationRepository.save(existingApplication);
        } else {
            // Apply mới
            JobApplication application = JobApplication.builder()
                    .job(job)
                    .freelancer(user)
                    .coverLetter(req != null ? req.getCoverLetter() : null)
                    .status(EApplicationStatus.PENDING)
                    .build();
            saved = jobApplicationRepository.save(application);
            
            job.incrementApplicationCount();
            jobRepository.save(job);
        }

        return ApiResponse.success("Ứng tuyển thành công (còn " + user.getCredits() + " credit)", buildApplicationResponse(saved));
    }

    /**
     * Lấy danh sách đơn ứng tuyển của tôi (Freelancer)
     */
    public ApiResponse<Page<JobApplicationResponse>> getMyApplications(Long userId, EApplicationStatus status,
                                                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<JobApplication> applications;
        if (status != null) {
            applications = jobApplicationRepository.findByFreelancerIdAndStatus(userId, status, pageable);
        } else {
            applications = jobApplicationRepository.findByFreelancerId(userId, pageable);
        }

        Page<JobApplicationResponse> response = applications.map(this::buildApplicationResponse);
        return ApiResponse.success("Thành công", response);
    }

    /**
     * Kiểm tra đơn ứng tuyển của tôi cho 1 job
     */
    public ApiResponse<JobApplicationResponse> getMyApplicationForJob(Long jobId, Long userId) {
        JobApplication application = jobApplicationRepository.findByJobIdAndFreelancerId(jobId, userId)
                .orElse(null);

        if (application == null || application.isWithdrawn()) {
            return ApiResponse.success("Chưa ứng tuyển", null);
        }

        return ApiResponse.success("Đã ứng tuyển", buildApplicationResponse(application));
    }

    /**
     * Rút đơn ứng tuyển
     */
    @Transactional
    public ApiResponse<Void> withdrawApplication(Long applicationId, Long userId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển"));

        if (!application.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền rút đơn này");
        }

        if (!application.isPending()) {
            throw new IllegalStateException("Chỉ có thể rút đơn đang chờ xử lý");
        }

        application.withdraw();
        jobApplicationRepository.save(application);

        return ApiResponse.success("Đã rút đơn ứng tuyển");
    }

    /**
     * Lấy danh sách đơn ứng tuyển của job (cho poster)
     */
    public ApiResponse<List<JobApplicationResponse>> getJobApplications(Long jobId, Long userId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem đơn ứng tuyển của job này");
        }

        List<JobApplication> applications = jobApplicationRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        List<JobApplicationResponse> responses = applications.stream()
                .map(this::buildApplicationResponse)
                .toList();

        return ApiResponse.success("Thành công", responses);
    }

    /**
     * Duyệt đơn ứng tuyển (poster)
     * - Tự động từ chối tất cả đơn pending khác của job đó
     */
    @Transactional
    public ApiResponse<JobApplicationResponse> acceptApplication(Long applicationId, Long userId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển"));

        if (!application.isJobOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền duyệt đơn này");
        }

        if (!application.isPending()) {
            throw new IllegalStateException("Chỉ có thể duyệt đơn đang chờ xử lý");
        }

        // Duyệt đơn này
        application.accept();
        jobApplicationRepository.save(application);

        // Từ chối tất cả đơn pending khác của job này
        Long jobId = application.getJob().getId();
        List<JobApplication> otherPendingApplications = jobApplicationRepository
                .findByJobIdAndStatusAndIdNot(jobId, EApplicationStatus.PENDING, applicationId);
        
        for (JobApplication other : otherPendingApplications) {
            other.reject();
        }
        jobApplicationRepository.saveAll(otherPendingApplications);

        int rejectedCount = otherPendingApplications.size();
        String message = rejectedCount > 0 
                ? "Đã duyệt đơn ứng tuyển và từ chối " + rejectedCount + " đơn khác"
                : "Đã duyệt đơn ứng tuyển";

        return ApiResponse.success(message, buildApplicationResponse(application));
    }

    /**
     * Từ chối đơn ứng tuyển (poster)
     */
    @Transactional
    public ApiResponse<JobApplicationResponse> rejectApplication(Long applicationId, Long userId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển"));

        if (!application.isJobOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền từ chối đơn này");
        }

        if (!application.isPending()) {
            throw new IllegalStateException("Chỉ có thể từ chối đơn đang chờ xử lý");
        }

        application.reject();
        jobApplicationRepository.save(application);

        return ApiResponse.success("Đã từ chối đơn ứng tuyển", buildApplicationResponse(application));
    }

    private JobApplicationResponse buildApplicationResponse(JobApplication application) {
        User freelancer = application.getFreelancer();
        Job job = application.getJob();

        JobApplicationResponse.FreelancerResponse freelancerResponse = JobApplicationResponse.FreelancerResponse.builder()
                .id(freelancer.getId())
                .fullName(freelancer.getFullName())
                .avatarUrl(freelancer.getAvatarUrl())
                .phoneNumber(freelancer.getPhoneNumber())
                .bio(freelancer.getBio())
                .skills(freelancer.getSkills())
                .build();

        return JobApplicationResponse.builder()
                .id(application.getId())
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .freelancer(freelancerResponse)
                .coverLetter(application.getCoverLetter())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
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
