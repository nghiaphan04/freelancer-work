package com.workhub.api.service;

import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.RepostJobRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.JobNotFoundException;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.DisputeRepository;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobContractRepository;
import com.workhub.api.repository.JobHistoryRepository;
import com.workhub.api.repository.JobRepository;
import com.workhub.api.repository.SavedJobRepository;
import com.workhub.api.repository.WithdrawalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobContractRepository jobContractRepository;
    private final JobHistoryRepository jobHistoryRepository;
    private final DisputeRepository disputeRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final SavedJobRepository savedJobRepository;
    private final UserService userService;
    private final JobHistoryService jobHistoryService;
    private final NotificationService notificationService;
    private final JobContractService jobContractService;
    private final ObjectMapper objectMapper;

    private static final BigDecimal FEE_PERCENT = new BigDecimal("5.00");

    @Transactional
    public ApiResponse<JobResponse> createJob(Long employerId, CreateJobRequest req) {
        User employer = userService.getById(employerId);

        boolean isDraft = Boolean.TRUE.equals(req.getSaveAsDraft());

        if (!isDraft) {
            if (req.getBudget() == null || req.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Job cần khai báo ngân sách hợp lệ");
            }
            if (req.getEscrowId() == null) {
                throw new IllegalStateException("Vui lòng hoàn tất thanh toán trước khi đăng công việc");
            }
            if (req.getWalletAddress() == null || req.getWalletAddress().isBlank()) {
                throw new IllegalStateException("Vui lòng cung cấp địa chỉ ví");
            }
        }

        BigDecimal budget = req.getBudget() != null ? req.getBudget() : BigDecimal.ZERO;
        BigDecimal feeAmount = budget.multiply(FEE_PERCENT).divide(new BigDecimal("100"), 8, RoundingMode.CEILING);
        BigDecimal total = budget.add(feeAmount);

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
                .budget(budget)
                .escrowAmount(isDraft ? null : total)
                .currency(req.getCurrency() != null ? req.getCurrency() : "APT")
                .applicationDeadline(req.getApplicationDeadline())
                .submissionDays(submissionDays)
                .reviewDays(reviewDays)
                .status(isDraft ? EJobStatus.DRAFT : EJobStatus.OPEN)
                .employer(employer)
                .build();

        if (!isDraft) {
            job.setEscrowId(req.getEscrowId());
            job.setEmployerWalletAddress(req.getWalletAddress());
            job.setEscrowTxHash(req.getTxHash());
        }

        Job savedJob = jobRepository.save(job);

        return ApiResponse.success(isDraft ? "Đã lưu bản nháp" : "Tạo job thành công", buildJobResponse(savedJob));
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

        Page<Job> jobs = jobRepository.findByStatusAndNotExpired(EJobStatus.OPEN, java.time.LocalDateTime.now(), pageable);
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

        Page<JobResponse> response = jobs.map(job -> buildJobResponseWithWorkInfo(job, freelancerId));
        return ApiResponse.success("Thành công", response);
    }

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
        Page<Job> jobs = jobRepository.searchJobs(keyword, EJobStatus.OPEN, java.time.LocalDateTime.now(), pageable);
        Page<JobResponse> response = jobs.map(this::buildJobResponse);
        return ApiResponse.success("Thành công", response);
    }

    public ApiResponse<Page<JobResponse>> getJobsBySkills(List<String> skills, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Job> jobs = jobRepository.findBySkillsAndStatus(skills, EJobStatus.OPEN, java.time.LocalDateTime.now(), pageable);
        Page<JobResponse> response = jobs.map(this::buildJobResponse);
        return ApiResponse.success("Thành công", response);
    }

    @Transactional
    public ApiResponse<JobResponse> updateJob(Long jobId, Long userId, UpdateJobRequest req) {
        Job job = getById(jobId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền sửa job này");
        }

        if (job.getStatus() != EJobStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể chỉnh sửa job ở trạng thái Bản nháp");
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

        if (req.getTxHash() != null) {
            job.setEscrowTxHash(req.getTxHash());
        }

        if (req.getEscrowId() != null) {
            job.setEscrowId(req.getEscrowId());
        }

        if (req.getWalletAddress() != null && !req.getWalletAddress().isBlank()) {
            job.setEmployerWalletAddress(req.getWalletAddress());
        }

        String message = "Cập nhật job thành công";
        if ("OPEN".equals(req.getStatus())) {
            if (job.getBudget() == null || job.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Cần có ngân sách để công khai");
            }
            if (req.getTxHash() == null || req.getTxHash().isBlank()) {
                throw new IllegalStateException("Cần xác nhận giao dịch từ hệ thống");
            }
            BigDecimal feeAmount = job.getBudget().multiply(FEE_PERCENT).divide(new BigDecimal("100"), 8, RoundingMode.CEILING);
            job.setEscrowAmount(job.getBudget().add(feeAmount));
            job.setStatus(EJobStatus.OPEN);
            message = "Đã công khai công việc";
        } else if ("DRAFT".equals(req.getStatus())) {
            job.setStatus(EJobStatus.DRAFT);
            message = "Đã lưu bản nháp";
        }

        Job updatedJob = jobRepository.save(job);

        JobContract contract = jobContractRepository.findByJobId(jobId).orElse(null);
        if (contract != null) {
            try {
                if (req.getTerms() != null) {
                    String termsJson = objectMapper.writeValueAsString(req.getTerms());
                    contract.setTermsJson(termsJson);
                }
                if (req.getBudget() != null) {
                    contract.setBudget(req.getBudget());
                }
                if (req.getRequirements() != null) {
                    contract.setRequirements(req.getRequirements());
                }
                if (req.getDeliverables() != null) {
                    contract.setDeliverables(req.getDeliverables());
                }
                if (req.getSubmissionDays() != null) {
                    contract.setDeadlineDays(req.getSubmissionDays());
                }
                if (req.getReviewDays() != null) {
                    contract.setReviewDays(req.getReviewDays());
                }
                // Sử dụng hash từ frontend nếu có (đảm bảo khớp với blockchain)
                if (req.getContractHash() != null && !req.getContractHash().isBlank()) {
                    contract.setContractHash(req.getContractHash());
                } else {
                    String newHash = jobContractService.computeHashFromContract(contract);
                    contract.setContractHash(newHash);
                }
                jobContractRepository.save(contract);
            } catch (Exception e) {
            }
        } else {
            try {
                String termsJson = req.getTerms() != null ? objectMapper.writeValueAsString(req.getTerms()) : "[]";
                // Sử dụng hash từ frontend nếu có
                String contractHash = req.getContractHash();
                JobContract newContract = JobContract.builder()
                        .job(updatedJob)
                        .budget(req.getBudget() != null ? req.getBudget() : updatedJob.getBudget())
                        .currency(updatedJob.getCurrency() != null ? updatedJob.getCurrency() : "APT")
                        .deadlineDays(req.getSubmissionDays() != null ? req.getSubmissionDays() : updatedJob.getSubmissionDays())
                        .reviewDays(req.getReviewDays() != null ? req.getReviewDays() : updatedJob.getReviewDays())
                        .requirements(req.getRequirements() != null ? req.getRequirements() : updatedJob.getRequirements())
                        .deliverables(req.getDeliverables() != null ? req.getDeliverables() : updatedJob.getDeliverables())
                        .termsJson(termsJson)
                        .employerSigned(true)
                        .employerSignedAt(java.time.LocalDateTime.now())
                        .freelancerSigned(false)
                        .build();
                if (contractHash == null || contractHash.isBlank()) {
                    contractHash = jobContractService.computeHashFromContract(newContract);
                }
                newContract.setContractHash(contractHash);
                jobContractRepository.save(newContract);
            } catch (Exception e) {
            }
        }

        return ApiResponse.success(message, buildJobResponse(updatedJob));
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

    @Transactional
    public ApiResponse<Void> deleteJob(Long jobId, Long userId, String txHash) {
        Job job = getById(jobId);
        User user = userService.getById(userId);

        if (!job.isOwnedBy(userId) && !user.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa job này");
        }

        EJobStatus status = job.getStatus();
        
        if (status != EJobStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể hủy job ở trạng thái Bản nháp");
        }

        if (job.getEscrowId() != null && (txHash == null || txHash.isBlank())) {
            throw new IllegalStateException("Cần xác nhận hủy escrow từ blockchain");
        }

        job.setStatus(EJobStatus.CANCELLED);
        jobRepository.save(job);

        jobHistoryRepository.save(JobHistory.builder()
                .job(job)
                .user(user)
                .action(EJobHistoryAction.JOB_CANCELLED)
                .description("Đã hủy công việc" + (txHash != null ? " - TxHash: " + txHash : ""))
                .build());
        
        return ApiResponse.success("Đã hủy công việc thành công");
    }

    @Transactional
    public ApiResponse<JobResponse> repostJob(Long jobId, Long userId, RepostJobRequest req) {
        Job job = getById(jobId);
        User user = userService.getById(userId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền đăng lại job này");
        }

        if (job.getStatus() != EJobStatus.CANCELLED) {
            throw new IllegalStateException("Chỉ có thể đăng lại job đã hủy");
        }

        boolean isDraft = Boolean.TRUE.equals(req.getSaveAsDraft());

        if (!isDraft) {
            if (job.getBudget() == null || job.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Job cần có ngân sách để công khai");
            }
            if (req.getTxHash() == null || req.getTxHash().isBlank()) {
                throw new IllegalStateException("Cần xác nhận giao dịch từ hệ thống");
            }
            if (req.getEscrowId() == null) {
                throw new IllegalStateException("Cần thanh toán để công khai");
            }
            if (req.getWalletAddress() == null || req.getWalletAddress().isBlank()) {
                throw new IllegalStateException("Cần cung cấp địa chỉ ví");
            }

            BigDecimal feeAmount = job.getBudget().multiply(FEE_PERCENT).divide(new BigDecimal("100"), 8, RoundingMode.CEILING);
            job.setEscrowAmount(job.getBudget().add(feeAmount));
            job.setEscrowId(req.getEscrowId());
            job.setEmployerWalletAddress(req.getWalletAddress());
            job.setEscrowTxHash(req.getTxHash());
            job.setStatus(EJobStatus.OPEN);
        } else {
            job.setStatus(EJobStatus.DRAFT);
        }

        Job savedJob = jobRepository.save(job);

        JobContract existingContract = jobContractRepository.findByJobId(jobId).orElse(null);
        if (existingContract == null) {
            try {
                // Sử dụng hash từ frontend nếu có
                String contractHash = req.getContractHash();
                JobContract newContract = JobContract.builder()
                        .job(savedJob)
                        .budget(savedJob.getBudget())
                        .currency(savedJob.getCurrency() != null ? savedJob.getCurrency() : "APT")
                        .deadlineDays(savedJob.getSubmissionDays() != null ? savedJob.getSubmissionDays() : 7)
                        .reviewDays(savedJob.getReviewDays() != null ? savedJob.getReviewDays() : 3)
                        .requirements(savedJob.getRequirements())
                        .deliverables(savedJob.getDeliverables())
                        .termsJson("[]")
                        .employerSigned(true)
                        .employerSignedAt(java.time.LocalDateTime.now())
                        .freelancerSigned(false)
                        .build();
                if (contractHash == null || contractHash.isBlank()) {
                    contractHash = jobContractService.computeHashFromContract(newContract);
                }
                newContract.setContractHash(contractHash);
                jobContractRepository.save(newContract);
            } catch (Exception e) {
            }
        } else if (req.getContractHash() != null && !req.getContractHash().isBlank()) {
            // Cập nhật hash nếu có
            existingContract.setContractHash(req.getContractHash());
            jobContractRepository.save(existingContract);
        }

        jobHistoryRepository.save(JobHistory.builder()
                .job(job)
                .user(user)
                .action(EJobHistoryAction.JOB_CREATED)
                .description("Đã đăng lại công việc" + (isDraft ? " (bản nháp)" : ""))
                .build());

        return ApiResponse.success(isDraft ? "Đã đăng lại dạng bản nháp" : "Đã đăng lại thành công", buildJobResponse(savedJob));
    }

    public Job getById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException(id));
    }

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

    public JobResponse buildJobResponse(Job job) {
        User employer = job.getEmployer();
        
        JobResponse.EmployerResponse employerResponse = JobResponse.EmployerResponse.builder()
                .id(employer.getId())
                .fullName(employer.getFullName())
                .avatarUrl(employer.getAvatarUrl())
                .walletAddress(employer.getWalletAddress())
                .title(employer.getTitle())
                .company(employer.getCompany())
                .location(employer.getLocation())
                .isVerified(employer.getIsVerified())
                .trustScore(employer.getTrustScore())
                .untrustScore(employer.getUntrustScore())
                .build();

        // Get dispute info if job is DISPUTED
        JobResponse.DisputeInfo disputeInfo = null;
        if (job.getStatus() == EJobStatus.DISPUTED) {
            var disputeOpt = disputeRepository.findByJobId(job.getId());
            if (disputeOpt.isPresent()) {
                var dispute = disputeOpt.get();
                disputeInfo = JobResponse.DisputeInfo.builder()
                        .id(dispute.getId())
                        .status(dispute.getStatus().name())
                        .evidenceDeadline(dispute.getEvidenceDeadline())
                        .hasFreelancerEvidence(dispute.hasFreelancerEvidence())
                        .currentRound(dispute.getCurrentRound())
                        .build();
            }
        }

        // Get work submission info from accepted application
        EWorkStatus workStatus = null;
        String workSubmissionUrl = null;
        String workSubmissionNote = null;
        java.time.LocalDateTime workSubmittedAt = null;
        JobResponse.FreelancerResponse freelancerResponse = null;
        var acceptedAppOpt = jobApplicationRepository.findFirstByJobIdAndStatus(job.getId(), EApplicationStatus.ACCEPTED);
        if (acceptedAppOpt.isPresent()) {
            var application = acceptedAppOpt.get();
            workStatus = application.getWorkStatus();
            workSubmissionUrl = application.getWorkSubmissionUrl();
            workSubmissionNote = application.getWorkSubmissionNote();
            workSubmittedAt = application.getWorkSubmittedAt();
            
            var freelancer = application.getFreelancer();
            if (freelancer != null) {
                freelancerResponse = JobResponse.FreelancerResponse.builder()
                        .id(freelancer.getId())
                        .fullName(freelancer.getFullName())
                        .avatarUrl(freelancer.getAvatarUrl())
                        .walletAddress(freelancer.getWalletAddress())
                        .build();
            }
        }

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
                .workSubmissionDeadline(job.getWorkSubmissionDeadline())
                .workReviewDeadline(job.getWorkReviewDeadline())
                .viewCount(job.getViewCount())
                .applicationCount(job.getApplicationCount())
                .employer(employerResponse)
                .freelancer(freelancerResponse)
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .escrowId(job.getEscrowId())
                .employerWalletAddress(job.getEmployerWalletAddress())
                .freelancerWalletAddress(job.getFreelancerWalletAddress())
                .escrowTxHash(job.getEscrowTxHash())
                .paymentTxHash(job.getPaymentTxHash())
                .refundTxHash(job.getRefundTxHash())
                .pendingBlockchainAction(job.getPendingBlockchainAction())
                .acceptedAt(job.getAcceptedAt())
                // FOR TESTING: 24h -> 90 seconds
                .signDeadline(job.getAcceptedAt() != null ? job.getAcceptedAt().plusSeconds(90) : null)
                .contractSignedAt(job.getContractSignedAt())
                .jobWorkSubmittedAt(job.getWorkSubmittedAt())
                .workStatus(workStatus)
                .workSubmissionUrl(workSubmissionUrl)
                .workSubmissionNote(workSubmissionNote)
                .workSubmittedAt(workSubmittedAt)
                .disputeInfo(disputeInfo)
                .build();
    }

    public JobResponse buildJobResponseWithWorkInfo(Job job, Long freelancerId) {
        JobResponse response = buildJobResponse(job);
        
        jobApplicationRepository.findByJobIdAndFreelancerId(job.getId(), freelancerId)
                .ifPresent(application -> {
                    response.setWorkStatus(application.getWorkStatus());
                    response.setWorkSubmissionUrl(application.getWorkSubmissionUrl());
                    response.setWorkSubmissionNote(application.getWorkSubmissionNote());
                    response.setWorkSubmittedAt(application.getWorkSubmittedAt());
                });
        
        return response;
    }

    @Transactional
    public ApiResponse<JobResponse> completeFreelancerTimeout(Long jobId, Long adminId, String txHash) {
        Job job = getById(jobId);
        User admin = userService.getById(adminId);

        if (!admin.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền admin");
        }

        if (job.getPendingBlockchainAction() != EPendingBlockchainAction.XOA_NGUOI_LAM) {
            throw new IllegalStateException("Công việc không có hành động chờ xử lý");
        }

        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy freelancer"));

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();

        application.setStatus(EApplicationStatus.REJECTED);
        application.clearWorkSubmission();
        jobApplicationRepository.save(application);

        job.reopenJob();
        job.setFreelancerWalletAddress(null);
        job.clearPendingBlockchainAction();
        jobRepository.save(job);


        jobHistoryService.logHistory(job, admin, EJobHistoryAction.JOB_REOPENED,
                "Admin đã xử lý: hủy người làm do quá hạn nộp sản phẩm");

        notificationService.notifyFreelancerCleared(employer, job, freelancer);

        return ApiResponse.success("Đã hoàn tất xử lý timeout freelancer", buildJobResponse(job));
    }

    @Transactional
    public ApiResponse<JobResponse> completeEmployerTimeout(Long jobId, Long adminId, String txHash) {
        Job job = getById(jobId);
        User admin = userService.getById(adminId);

        if (!admin.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền admin");
        }

        if (job.getPendingBlockchainAction() != EPendingBlockchainAction.TRA_TIEN_NGUOI_LAM) {
            throw new IllegalStateException("Công việc không có hành động chờ xử lý");
        }

        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy freelancer"));

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        java.math.BigDecimal payment = job.getBudget();

        application.approveWork();
        jobApplicationRepository.save(application);

        job.complete();
        job.clearDeadlines();
        job.setPaymentTxHash(txHash);
        job.clearPendingBlockchainAction();
        jobRepository.save(job);


        jobHistoryService.logHistory(job, admin, EJobHistoryAction.AUTO_APPROVED,
                "Admin đã xử lý: thanh toán tự động do quá hạn duyệt");
        jobHistoryService.logHistory(job, admin, EJobHistoryAction.JOB_COMPLETED,
                "Công việc hoàn thành. Thanh toán " + payment.toPlainString() + " " + job.getCurrency());

        notificationService.notifyAutoApproved(freelancer, job, payment.toPlainString() + " " + job.getCurrency());
        notificationService.notifyJobCompleted(freelancer, job);
        notificationService.notifyJobCompleted(employer, job);

        return ApiResponse.success("Đã hoàn tất xử lý timeout employer", buildJobResponse(job));
    }

    public ApiResponse<Page<JobResponse>> getPendingBlockchainActions(int page, int size) {
        Page<Job> jobs = jobRepository.findByPendingBlockchainActionNot(
                EPendingBlockchainAction.NONE,
                PageRequest.of(page, size, Sort.by("updatedAt").descending())
        );
        Page<JobResponse> responses = jobs.map(this::buildJobResponse);
        return ApiResponse.success("Thành công", responses);
    }

    /**
     * Freelancer từ chối hợp đồng - Job quay lại OPEN
     */
    @Transactional
    public ApiResponse<JobResponse> rejectContract(Long jobId, Long userId, String txHash) {
        Job job = getById(jobId);
        User freelancer = userService.getById(userId);

        if (job.getStatus() != EJobStatus.PENDING_SIGNATURE) {
            throw new IllegalStateException("Công việc không ở trạng thái chờ ký hợp đồng");
        }

        // Verify freelancer is the assigned one
        JobApplication acceptedApp = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy đơn ứng tuyển"));

        if (!acceptedApp.getFreelancer().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người được chọn cho công việc này");
        }

        // Reset application status
        acceptedApp.setStatus(EApplicationStatus.REJECTED);
        jobApplicationRepository.save(acceptedApp);

        // Reset job status
        job.setStatus(EJobStatus.OPEN);
        job.setFreelancerWalletAddress(null);
        Job updatedJob = jobRepository.save(job);

        jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.APPLICATION_REJECTED,
                "Freelancer đã từ chối ký hợp đồng");

        User employer = job.getEmployer();
        notificationService.notifyApplicationRejected(employer, job);

        return ApiResponse.success("Đã từ chối hợp đồng", buildJobResponse(updatedJob));
    }

    /**
     * Employer hủy job trước khi freelancer ký - hoàn tiền, job cancelled
     */
    @Transactional
    public ApiResponse<JobResponse> cancelBeforeSign(Long jobId, Long userId, String txHash) {
        Job job = getById(jobId);
        User employer = userService.getById(userId);

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền hủy công việc này");
        }

        if (job.getStatus() != EJobStatus.PENDING_SIGNATURE) {
            throw new IllegalStateException("Công việc không ở trạng thái chờ ký hợp đồng");
        }

        // Get freelancer to notify
        JobApplication acceptedApp = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElse(null);

        User freelancer = acceptedApp != null ? acceptedApp.getFreelancer() : null;

        // Reset application if exists
        if (acceptedApp != null) {
            acceptedApp.setStatus(EApplicationStatus.REJECTED);
            jobApplicationRepository.save(acceptedApp);
        }

        // Cancel job
        job.setStatus(EJobStatus.CANCELLED);
        job.setFreelancerWalletAddress(null);
        Job updatedJob = jobRepository.save(job);

        jobHistoryService.logHistory(job, employer, EJobHistoryAction.JOB_CANCELLED,
                "Employer đã hủy công việc trước khi freelancer ký hợp đồng");

        if (freelancer != null) {
            notificationService.notifyJobCancelled(freelancer, job);
        }

        return ApiResponse.success("Đã hủy công việc", buildJobResponse(updatedJob));
    }

    /**
     * Xóa freelancer nếu quá 24h không ký - Job quay lại OPEN
     */
    @Transactional
    public ApiResponse<JobResponse> removeUnsignedFreelancer(Long jobId, Long userId, String txHash) {
        Job job = getById(jobId);
        User caller = userService.getById(userId);

        if (job.getStatus() != EJobStatus.PENDING_SIGNATURE) {
            throw new IllegalStateException("Công việc không ở trạng thái chờ ký hợp đồng");
        }

        // Get accepted application
        JobApplication acceptedApp = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy đơn ứng tuyển"));

        User freelancer = acceptedApp.getFreelancer();

        // Reset application status
        acceptedApp.setStatus(EApplicationStatus.REJECTED);
        jobApplicationRepository.save(acceptedApp);

        // Reset job status
        job.setStatus(EJobStatus.OPEN);
        job.setFreelancerWalletAddress(null);
        Job updatedJob = jobRepository.save(job);

        jobHistoryService.logHistory(job, caller, EJobHistoryAction.FREELANCER_TIMEOUT,
                "Freelancer bị xóa do quá hạn 1p30s không ký hợp đồng");

        User employer = job.getEmployer();
        notificationService.notifyFreelancerCleared(employer, job, freelancer);
        notificationService.notifyApplicationRejected(freelancer, job);

        return ApiResponse.success("Đã xóa freelancer do quá hạn ký", buildJobResponse(updatedJob));
    }
}
