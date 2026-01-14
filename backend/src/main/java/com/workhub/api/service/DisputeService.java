package com.workhub.api.service;

import com.workhub.api.dto.request.CreateDisputeRequest;
import com.workhub.api.dto.request.DisputeResponseRequest;
import com.workhub.api.dto.request.ResolveDisputeRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.DisputeResponse;
import com.workhub.api.dto.response.FileUploadResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.DisputeRepository;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobService jobService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final JobHistoryService jobHistoryService;
    private final FileUploadService fileUploadService;

    /**
     * Employer tạo khiếu nại (trong thời gian review sản phẩm)
     */
    @Transactional
    public ApiResponse<DisputeResponse> createDispute(Long jobId, Long userId, CreateDisputeRequest req) {
        Job job = jobService.getById(jobId);
        User employer = userService.getById(userId);

        // Kiểm tra quyền
        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        // Kiểm tra trạng thái job
        if (!job.isInProgress()) {
            throw new IllegalStateException("Chỉ có thể tạo khiếu nại khi công việc đang thực hiện");
        }

        // Kiểm tra đã có khiếu nại chưa
        List<EDisputeStatus> activeStatuses = List.of(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE,
                EDisputeStatus.PENDING_ADMIN_DECISION
        );
        if (disputeRepository.existsByJobIdAndStatusIn(jobId, activeStatuses)) {
            throw new IllegalStateException("Công việc này đã có khiếu nại đang xử lý");
        }

        // Tìm freelancer đang làm
        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy freelancer đang làm"));
        User freelancer = application.getFreelancer();

        // Kiểm tra freelancer đã nộp sản phẩm chưa
        if (!application.isWorkSubmitted()) {
            throw new IllegalStateException("Chỉ có thể tạo khiếu nại sau khi freelancer đã nộp sản phẩm");
        }

        // Tạo dispute
        Dispute dispute = Dispute.builder()
                .job(job)
                .employer(employer)
                .freelancer(freelancer)
                .employerEvidenceUrl(req.getEvidenceUrl())
                .employerEvidenceFileId(req.getFileId())
                .employerDescription(req.getDescription())
                .status(EDisputeStatus.PENDING_FREELANCER_RESPONSE)
                .build();

        // Khóa job
        job.dispute();
        jobRepository.save(job);

        Dispute saved = disputeRepository.save(dispute);
        if (req.getFileId() != null) {
            fileUploadService.assignFileToReference(req.getFileId(), "DISPUTE", saved.getId());
        }

        // Ghi lịch sử
        jobHistoryService.logHistory(job, employer, EJobHistoryAction.DISPUTE_CREATED,
                "Đã tạo khiếu nại: " + req.getDescription());

        // Thông báo cho admin (system notification)
        // Thông báo cho freelancer
        notificationService.notifyDisputeCreated(freelancer, job, employer);

        return ApiResponse.success("Đã tạo khiếu nại thành công. Chờ admin xử lý.", buildResponse(saved));
    }

    /**
     * Lấy thông tin khiếu nại của job
     */
    public ApiResponse<DisputeResponse> getDisputeByJobId(Long jobId, Long userId) {
        Job job = jobService.getById(jobId);
        User user = userService.getById(userId);

        // Kiểm tra quyền xem (employer, freelancer của job, hoặc admin)
        boolean isEmployer = job.isOwnedBy(userId);
        boolean isFreelancer = jobApplicationRepository.existsByJobIdAndFreelancerIdAndStatus(
                jobId, userId, EApplicationStatus.ACCEPTED);
        boolean isAdmin = user.isAdmin();

        if (!isEmployer && !isFreelancer && !isAdmin) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin này");
        }

        Dispute dispute = disputeRepository.findByJobId(jobId)
                .orElse(null);

        if (dispute == null) {
            return ApiResponse.success("Không có khiếu nại", null);
        }

        return ApiResponse.success("Thành công", buildResponse(dispute));
    }

    /**
     * [ADMIN] Yêu cầu freelancer phản hồi
     */
    @Transactional
    public ApiResponse<DisputeResponse> requestFreelancerResponse(Long disputeId, Long adminId, int daysToRespond) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));

        if (!dispute.isPendingFreelancerResponse()) {
            throw new IllegalStateException("Khiếu nại không ở trạng thái chờ phản hồi");
        }

        // Set deadline
        dispute.requestFreelancerResponse(daysToRespond);
        Dispute saved = disputeRepository.save(dispute);

        // Thông báo cho freelancer
        notificationService.notifyDisputeResponseRequested(
                dispute.getFreelancer(), dispute.getJob(), daysToRespond);

        return ApiResponse.success(
                "Đã gửi yêu cầu phản hồi. Freelancer có " + daysToRespond + " ngày để phản hồi.",
                buildResponse(saved));
    }

    /**
     * Freelancer gửi phản hồi
     */
    @Transactional
    public ApiResponse<DisputeResponse> submitFreelancerResponse(Long disputeId, Long userId, DisputeResponseRequest req) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));

        // Kiểm tra quyền
        if (!dispute.getFreelancer().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải freelancer của khiếu nại này");
        }

        // Kiểm tra có thể phản hồi không
        if (!dispute.canFreelancerRespond()) {
            throw new IllegalStateException("Không thể gửi phản hồi. Hạn phản hồi đã qua hoặc trạng thái không hợp lệ.");
        }

        // Submit response
        dispute.submitFreelancerResponse(req.getEvidenceUrl(), req.getDescription());
        dispute.setFreelancerEvidenceFileId(req.getFileId());
        Dispute saved = disputeRepository.save(dispute);
        if (req.getFileId() != null) {
            fileUploadService.assignFileToReference(req.getFileId(), "DISPUTE", dispute.getId());
        }

        // Ghi lịch sử
        Job job = dispute.getJob();
        User freelancer = dispute.getFreelancer();
        jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.DISPUTE_RESPONSE_SUBMITTED,
                "Đã gửi phản hồi khiếu nại");

        // Thông báo cho admin và employer
        notificationService.notifyDisputeResponseSubmitted(dispute.getEmployer(), job, freelancer);

        return ApiResponse.success("Đã gửi phản hồi thành công. Chờ admin quyết định.", buildResponse(saved));
    }

    /**
     * [ADMIN] Quyết định tranh chấp
     */
    @Transactional
    public ApiResponse<DisputeResponse> resolveDispute(Long disputeId, Long adminId, ResolveDisputeRequest req) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));
        User admin = userService.getById(adminId);

        if (dispute.isResolved()) {
            throw new IllegalStateException("Khiếu nại đã được giải quyết");
        }

        Job job = dispute.getJob();
        User employer = dispute.getEmployer();
        User freelancer = dispute.getFreelancer();
        BigDecimal escrowAmount = job.getBudget();  // Số tiền trả cho winner

        User winner;
        User loser;

        if (req.getEmployerWins()) {
            // Employer thắng
            dispute.resolveForEmployer(admin, req.getNote());
            winner = employer;
            loser = freelancer;

            // Trả tiền cho employer
            if (escrowAmount != null && escrowAmount.compareTo(BigDecimal.ZERO) > 0) {
                employer.addBalance(escrowAmount);
                userService.save(employer);
            }
        } else {
            // Freelancer thắng
            dispute.resolveForFreelancer(admin, req.getNote());
            winner = freelancer;
            loser = employer;

            // Trả tiền cho freelancer
            if (escrowAmount != null && escrowAmount.compareTo(BigDecimal.ZERO) > 0) {
                freelancer.addBalance(escrowAmount);
                userService.save(freelancer);
            }
        }

        // Loser: +1 KUT, -1 UT
        loser.addUntrustScore(1);
        loser.deductTrustScore(1);
        userService.save(loser);

        // Cập nhật job status
        job.setStatus(EJobStatus.COMPLETED);
        job.clearDeadlines();
        jobRepository.save(job);

        Dispute saved = disputeRepository.save(dispute);

        // Ghi lịch sử
        String resultMessage = req.getEmployerWins()
                ? "Employer thắng tranh chấp. Lý do: " + req.getNote()
                : "Freelancer thắng tranh chấp. Lý do: " + req.getNote();
        jobHistoryService.logHistory(job, admin, EJobHistoryAction.DISPUTE_RESOLVED, resultMessage);

        // Thông báo cho cả 2 bên
        notificationService.notifyDisputeResolvedWin(winner, job, escrowAmount.toPlainString());
        notificationService.notifyDisputeResolvedLose(loser, job);

        return ApiResponse.success(
                "Đã giải quyết tranh chấp. " + winner.getFullName() + " thắng.",
                buildResponse(saved));
    }

    /**
     * [ADMIN] Lấy danh sách khiếu nại đang chờ xử lý
     */
    public ApiResponse<Page<DisputeResponse>> getPendingDisputes(int page, int size) {
        List<EDisputeStatus> pendingStatuses = List.of(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE,
                EDisputeStatus.PENDING_ADMIN_DECISION
        );
        Page<Dispute> disputes = disputeRepository.findByStatusIn(
                pendingStatuses,
                PageRequest.of(page, size, Sort.by("createdAt").ascending())
        );
        return ApiResponse.success("Thành công", disputes.map(this::buildResponse));
    }

    /**
     * [ADMIN] Đếm số khiếu nại đang chờ
     */
    public ApiResponse<Long> countPendingDisputes() {
        List<EDisputeStatus> pendingStatuses = List.of(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE,
                EDisputeStatus.PENDING_ADMIN_DECISION
        );
        long count = disputeRepository.countByStatusIn(pendingStatuses);
        return ApiResponse.success("Thành công", count);
    }

    /**
     * Scheduler: Kiểm tra các freelancer hết hạn phản hồi
     * Chạy mỗi 5 phút
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void checkExpiredFreelancerDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        List<Dispute> expiredDisputes = disputeRepository.findExpiredFreelancerDeadlines(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE, now);

        for (Dispute dispute : expiredDisputes) {
            try {
                // Chuyển sang chờ admin quyết định
                dispute.moveToAdminDecision();
                disputeRepository.save(dispute);
                log.info("Dispute {} moved to admin decision (freelancer deadline expired)", dispute.getId());
            } catch (Exception e) {
                log.error("Error processing expired dispute {}: {}", dispute.getId(), e.getMessage());
            }
        }

        if (!expiredDisputes.isEmpty()) {
            log.info("Processed {} expired freelancer response deadlines", expiredDisputes.size());
        }
    }

    private DisputeResponse buildResponse(Dispute dispute) {
        return DisputeResponse.fromEntity(
                dispute,
                toAttachment(dispute.getEmployerEvidenceFileId()),
                toAttachment(dispute.getFreelancerEvidenceFileId())
        );
    }

    private DisputeResponse.FileAttachment toAttachment(Long fileId) {
        if (fileId == null) {
            return null;
        }
        FileUploadResponse file = fileUploadService.getFileById(fileId);
        return DisputeResponse.FileAttachment.builder()
                .id(file.getId())
                .secureUrl(file.getSecureUrl())
                .originalFilename(file.getOriginalFilename())
                .readableSize(file.getReadableSize())
                .build();
    }
}
