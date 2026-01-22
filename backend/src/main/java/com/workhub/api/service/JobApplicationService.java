package com.workhub.api.service;

import com.workhub.api.dto.request.ApplyJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.JobNotFoundException;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobContractRepository;
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

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobContractRepository jobContractRepository;
    private final JobService jobService;
    private final UserService userService;
    private final JobHistoryService jobHistoryService;
    private final NotificationService notificationService;
    private final JobContractService jobContractService;

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

        if (req == null || req.getWalletAddress() == null || req.getWalletAddress().isBlank()) {
            throw new IllegalStateException("Vui lòng kết nối ví Aptos để ứng tuyển");
        }

        JobApplication existingApplication = jobApplicationRepository.findByJobIdAndFreelancerId(jobId, userId).orElse(null);
        
        if (existingApplication != null && !existingApplication.canReapply()) {
            throw new IllegalStateException("Bạn đã ứng tuyển vào công việc này rồi");
        }

        JobApplication saved;
        if (existingApplication != null && existingApplication.canReapply()) {
            existingApplication.reapply(req.getCoverLetter());
            existingApplication.setWalletAddress(req.getWalletAddress());
            saved = jobApplicationRepository.save(existingApplication);
        } else {
            JobApplication application = JobApplication.builder()
                    .job(job)
                    .freelancer(user)
                    .coverLetter(req.getCoverLetter())
                    .walletAddress(req.getWalletAddress())
                    .status(EApplicationStatus.PENDING)
                    .build();
            saved = jobApplicationRepository.save(application);
            
            job.incrementApplicationCount();
            jobRepository.save(job);
        }

        jobHistoryService.logHistory(job, user, EJobHistoryAction.APPLICATION_SUBMITTED,
                "Đã nộp đơn ứng tuyển");

        notificationService.notifyNewApplication(job.getEmployer(), job, user);

        return ApiResponse.success("Ứng tuyển thành công", buildApplicationResponse(saved));
    }

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

    public ApiResponse<JobApplicationResponse> getMyApplicationForJob(Long jobId, Long userId) {
        JobApplication application = jobApplicationRepository.findByJobIdAndFreelancerId(jobId, userId)
                .orElse(null);

        if (application == null) {
            return ApiResponse.success("Chưa ứng tuyển", null);
        }

        return ApiResponse.success("Đã ứng tuyển", buildApplicationResponse(application));
    }

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

    @Transactional
    public ApiResponse<JobApplicationResponse> acceptApplication(Long applicationId, Long userId, String txHash) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển"));

        if (!application.isJobOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền duyệt đơn này");
        }

        if (!application.isPending()) {
            throw new IllegalStateException("Chỉ có thể duyệt đơn đang chờ xử lý");
        }

        if (txHash == null || txHash.isBlank()) {
            throw new IllegalStateException("Không thể thực hiện thao tác");
        }

        application.accept();
        jobApplicationRepository.save(application);

        Job job = application.getJob();
        job.setStatus(EJobStatus.PENDING_SIGNATURE);
        job.setFreelancerWalletAddress(application.getWalletAddress());
        job.setAcceptedAt(LocalDateTime.now());  // Lưu thời điểm duyệt để tính hạn ký 24h
        jobRepository.save(job);

        Long jobId = job.getId();

        JobContract existingContract = jobContractRepository.findByJobId(jobId).orElse(null);
        if (existingContract == null) {
            JobContract newContract = JobContract.builder()
                    .job(job)
                    .budget(job.getBudget())
                    .currency(job.getCurrency() != null ? job.getCurrency() : "APT")
                    .deadlineDays(job.getSubmissionDays() != null ? job.getSubmissionDays() : 7)
                    .reviewDays(job.getReviewDays() != null ? job.getReviewDays() : 3)
                    .requirements(job.getRequirements())
                    .deliverables(job.getDeliverables())
                    .termsJson("[]")
                    .employerSigned(true)
                    .employerSignedAt(LocalDateTime.now())
                    .freelancerSigned(false)
                    .build();
            String hash = jobContractService.computeHashFromContract(newContract);
            newContract.setContractHash(hash);
            jobContractRepository.save(newContract);
        }
        List<JobApplication> otherPendingApplications = jobApplicationRepository
                .findByJobIdAndStatusAndIdNot(jobId, EApplicationStatus.PENDING, applicationId);
        
        for (JobApplication other : otherPendingApplications) {
            other.reject();
        }
        jobApplicationRepository.saveAll(otherPendingApplications);

        User employer = userService.getById(userId);
        User freelancer = application.getFreelancer();
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.APPLICATION_ACCEPTED,
                "Đã chấp nhận người làm " + freelancer.getFullName());

        notificationService.notifyApplicationAccepted(freelancer, job);

        for (JobApplication other : otherPendingApplications) {
            notificationService.notifyApplicationRejected(other.getFreelancer(), job);
        }

        int rejectedCount = otherPendingApplications.size();
        String message = rejectedCount > 0 
                ? "Đã duyệt đơn ứng tuyển và từ chối " + rejectedCount + " đơn khác"
                : "Đã duyệt đơn ứng tuyển";

        return ApiResponse.success(message, buildApplicationResponse(application));
    }

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

        Job job = application.getJob();
        User employer = userService.getById(userId);
        User freelancer = application.getFreelancer();
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.APPLICATION_REJECTED,
                "Đã từ chối người làm " + freelancer.getFullName());

        notificationService.notifyApplicationRejected(freelancer, job);

        return ApiResponse.success("Đã từ chối đơn ứng tuyển", buildApplicationResponse(application));
    }

    @Transactional
    public ApiResponse<BatchRejectResult> batchRejectApplications(Long jobId, List<Long> applicationIds, Long userId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền từ chối đơn của công việc này");
        }

        User employer = userService.getById(userId);
        int successCount = 0;
        int failCount = 0;

        for (Long appId : applicationIds) {
            try {
                JobApplication application = jobApplicationRepository.findById(appId).orElse(null);
                if (application == null || !application.getJob().getId().equals(jobId)) {
                    failCount++;
                    continue;
                }
                if (!application.isPending()) {
                    failCount++;
                    continue;
                }

                application.reject();
                jobApplicationRepository.save(application);

                User freelancer = application.getFreelancer();
                notificationService.notifyApplicationRejected(freelancer, job);
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }

        if (successCount > 0) {
            jobHistoryService.logHistory(job, employer, EJobHistoryAction.APPLICATION_REJECTED,
                    "Đã từ chối " + successCount + " người làm");
        }

        BatchRejectResult result = new BatchRejectResult(successCount, failCount);
        String message = successCount > 0 
                ? "Đã từ chối " + successCount + " người làm" 
                : "Không có đơn nào được từ chối";
        
        return ApiResponse.success(message, result);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class BatchRejectResult {
        private int successCount;
        private int failCount;
    }

    public JobApplicationResponse buildApplicationResponse(JobApplication application) {
        User freelancer = application.getFreelancer();
        Job job = application.getJob();

        JobApplicationResponse.FreelancerResponse freelancerResponse = JobApplicationResponse.FreelancerResponse.builder()
                .id(freelancer.getId())
                .fullName(freelancer.getFullName())
                .avatarUrl(freelancer.getAvatarUrl())
                .walletAddress(freelancer.getWalletAddress())
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
                .walletAddress(application.getWalletAddress())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
