package com.workhub.api.service;

import com.workhub.api.dto.request.ApplyJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
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

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service xử lý các chức năng ứng tuyển và duyệt đơn
 */
@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobService jobService;
    private final UserService userService;
    private final JobHistoryService jobHistoryService;
    private final NotificationService notificationService;

    /**
     * Freelancer ứng tuyển job
     */
    @Transactional
    public ApiResponse<JobApplicationResponse> applyJob(Long jobId, Long userId, ApplyJobRequest req) {
        User user = userService.getById(userId);
        Job job = jobService.getById(jobId);

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
            existingApplication.reapply(req != null ? req.getCoverLetter() : null);
            saved = jobApplicationRepository.save(existingApplication);
        } else {
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

        // Ghi lịch sử - Freelancer ứng tuyển
        jobHistoryService.logHistory(job, user, EJobHistoryAction.APPLICATION_SUBMITTED,
                "Đã nộp đơn ứng tuyển");

        // Gửi thông báo cho employer
        notificationService.notifyNewApplication(job.getEmployer(), job, user);

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
     * - Chuyển job sang IN_PROGRESS
     * - Ghi lịch sử
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

        // Chuyển job sang IN_PROGRESS và set deadline nộp sản phẩm
        Job job = application.getJob();
        job.setStatus(EJobStatus.IN_PROGRESS);
        
        int submissionDays = job.getSubmissionDays() != null && job.getSubmissionDays() >= 1
                ? job.getSubmissionDays()
                : 1;
        java.time.LocalDateTime submissionDeadline = java.time.LocalDateTime.now().plusDays(submissionDays);
        job.setWorkSubmissionDeadline(submissionDeadline);
        
        jobRepository.save(job);

        // Từ chối tất cả đơn pending khác của job này
        Long jobId = job.getId();
        List<JobApplication> otherPendingApplications = jobApplicationRepository
                .findByJobIdAndStatusAndIdNot(jobId, EApplicationStatus.PENDING, applicationId);
        
        for (JobApplication other : otherPendingApplications) {
            other.reject();
        }
        jobApplicationRepository.saveAll(otherPendingApplications);

        // Ghi lịch sử - Employer duyệt ứng viên
        User employer = userService.getById(userId);
        User freelancer = application.getFreelancer();
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.APPLICATION_ACCEPTED,
                "Đã duyệt ứng viên " + freelancer.getFullName());

        // Gửi thông báo cho freelancer được chấp nhận
        notificationService.notifyApplicationAccepted(freelancer, job);

        // Gửi thông báo cho các freelancer bị từ chối
        for (JobApplication other : otherPendingApplications) {
            notificationService.notifyApplicationRejected(other.getFreelancer(), job);
        }

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

        // Ghi lịch sử
        Job job = application.getJob();
        User employer = userService.getById(userId);
        User freelancer = application.getFreelancer();
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.APPLICATION_REJECTED,
                "Đã từ chối ứng viên " + freelancer.getFullName());

        // Gửi thông báo cho freelancer
        notificationService.notifyApplicationRejected(freelancer, job);

        return ApiResponse.success("Đã từ chối đơn ứng tuyển", buildApplicationResponse(application));
    }

    /**
     * Build response từ JobApplication entity
     */
    public JobApplicationResponse buildApplicationResponse(JobApplication application) {
        User freelancer = application.getFreelancer();
        Job job = application.getJob();

        JobApplicationResponse.FreelancerResponse freelancerResponse = JobApplicationResponse.FreelancerResponse.builder()
                .id(freelancer.getId())
                .fullName(freelancer.getFullName())
                .avatarUrl(freelancer.getAvatarUrl())
                .phoneNumber(freelancer.getPhoneNumber())
                .bio(freelancer.getBio())
                .skills(freelancer.getSkills())
                .trustScore(freelancer.getTrustScore())
                .untrustScore(freelancer.getUntrustScore())
                .build();

        return JobApplicationResponse.builder()
                .id(application.getId())
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .freelancer(freelancerResponse)
                .coverLetter(application.getCoverLetter())
                .status(application.getStatus())
                .workStatus(application.getWorkStatus())
                .workStatusLabel(JobApplicationResponse.getWorkStatusLabel(application.getWorkStatus()))
                .workSubmissionUrl(application.getWorkSubmissionUrl())
                .workSubmissionNote(application.getWorkSubmissionNote())
                .workSubmittedAt(application.getWorkSubmittedAt())
                .workRevisionNote(application.getWorkRevisionNote())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }

}
