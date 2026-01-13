package com.workhub.api.service;

import com.workhub.api.dto.request.CreateWithdrawalRequest;
import com.workhub.api.dto.request.RespondWithdrawalRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.WithdrawalRequestResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobRepository;
import com.workhub.api.repository.WithdrawalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WithdrawalRequestService {

    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final JobHistoryService jobHistoryService;

    private static final int FREELANCER_PENALTY_PERCENT = 12;
    private static final int EMPLOYER_PENALTY_PERCENT = 40;

    /**
     * Freelancer tạo yêu cầu rút khỏi job
     */
    @Transactional
    public ApiResponse<WithdrawalRequestResponse> createFreelancerWithdrawal(Long jobId, Long userId, CreateWithdrawalRequest req) {
        User user = userService.getById(userId);
        Job job = getJobById(jobId);

        if (job.getStatus() != EJobStatus.IN_PROGRESS) {
            throw new IllegalStateException("Chỉ có thể tạo yêu cầu rút khi công việc đang thực hiện");
        }

        boolean isAcceptedFreelancer = jobApplicationRepository
                .existsByJobIdAndFreelancerIdAndStatus(jobId, userId, EApplicationStatus.ACCEPTED);
        if (!isAcceptedFreelancer) {
            throw new UnauthorizedAccessException("Bạn không phải người làm của công việc này");
        }

        if (withdrawalRequestRepository.existsByJobIdAndStatus(jobId, EWithdrawalRequestStatus.PENDING)) {
            throw new IllegalStateException("Đã có yêu cầu hủy/rút đang chờ xử lý cho công việc này");
        }

        // Tính phí phạt
        BigDecimal escrowAmount = job.getEscrowAmount();
        BigDecimal penaltyFee = escrowAmount
                .multiply(BigDecimal.valueOf(FREELANCER_PENALTY_PERCENT))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (!user.hasEnoughBalance(penaltyFee)) {
            throw new IllegalStateException("Số dư không đủ để tạo yêu cầu. Cần có ít nhất " + penaltyFee.toPlainString() + " VND");
        }

        // Trừ tiền phạt
        user.deductBalance(penaltyFee);
        userService.save(user);

        // Tạo yêu cầu
        WithdrawalRequest request = WithdrawalRequest.builder()
                .job(job)
                .requester(user)
                .type(EWithdrawalRequestType.FREELANCER_WITHDRAW)
                .reason(req.getReason())
                .penaltyFee(penaltyFee)
                .penaltyPercent(FREELANCER_PENALTY_PERCENT)
                .build();

        WithdrawalRequest saved = withdrawalRequestRepository.save(request);

        // Ghi lịch sử
        jobHistoryService.logHistory(job, user, EJobHistoryAction.WITHDRAWAL_REQUESTED,
                "Yêu cầu rút khỏi công việc. Lý do: " + req.getReason());

        // Thông báo cho employer
        notificationService.notifyWithdrawalRequested(job.getEmployer(), job, user, true);

        return ApiResponse.success("Đã tạo yêu cầu rút. Phí phạt " + penaltyFee.toPlainString() + " VND đã được trừ.",
                WithdrawalRequestResponse.fromEntity(saved));
    }

    /**
     * Employer tạo yêu cầu hủy job
     */
    @Transactional
    public ApiResponse<WithdrawalRequestResponse> createEmployerCancellation(Long jobId, Long userId, CreateWithdrawalRequest req) {
        User user = userService.getById(userId);
        Job job = getJobById(jobId);

        if (job.getStatus() != EJobStatus.IN_PROGRESS) {
            throw new IllegalStateException("Chỉ có thể tạo yêu cầu hủy khi công việc đang thực hiện");
        }

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        if (withdrawalRequestRepository.existsByJobIdAndStatus(jobId, EWithdrawalRequestStatus.PENDING)) {
            throw new IllegalStateException("Đã có yêu cầu hủy/rút đang chờ xử lý cho công việc này");
        }

        // Tính phí phạt
        BigDecimal escrowAmount = job.getEscrowAmount();
        BigDecimal penaltyFee = escrowAmount
                .multiply(BigDecimal.valueOf(EMPLOYER_PENALTY_PERCENT))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (!user.hasEnoughBalance(penaltyFee)) {
            throw new IllegalStateException("Số dư không đủ để tạo yêu cầu. Cần có ít nhất " + penaltyFee.toPlainString() + " VND");
        }

        // Trừ tiền phạt
        user.deductBalance(penaltyFee);
        userService.save(user);

        // Tạo yêu cầu
        WithdrawalRequest request = WithdrawalRequest.builder()
                .job(job)
                .requester(user)
                .type(EWithdrawalRequestType.EMPLOYER_CANCEL)
                .reason(req.getReason())
                .penaltyFee(penaltyFee)
                .penaltyPercent(EMPLOYER_PENALTY_PERCENT)
                .build();

        WithdrawalRequest saved = withdrawalRequestRepository.save(request);

        // Ghi lịch sử
        jobHistoryService.logHistory(job, user, EJobHistoryAction.WITHDRAWAL_REQUESTED,
                "Yêu cầu hủy công việc. Lý do: " + req.getReason());

        // Thông báo cho freelancer
        User freelancer = getAcceptedFreelancer(jobId);
        if (freelancer != null) {
            notificationService.notifyWithdrawalRequested(freelancer, job, user, false);
        }

        return ApiResponse.success("Đã tạo yêu cầu hủy. Phí phạt " + penaltyFee.toPlainString() + " VND đã được trừ.",
                WithdrawalRequestResponse.fromEntity(saved));
    }

    /**
     * Chấp nhận yêu cầu rút/hủy
     */
    @Transactional
    public ApiResponse<WithdrawalRequestResponse> approveRequest(Long requestId, Long userId, RespondWithdrawalRequest req) {
        User user = userService.getById(userId);
        WithdrawalRequest request = getRequestById(requestId);

        if (!request.isPending()) {
            throw new IllegalStateException("Yêu cầu này đã được xử lý");
        }

        // Kiểm tra quyền: người còn lại mới có quyền approve
        Job job = request.getJob();
        if (request.isFreelancerRequest()) {
            // Freelancer tạo → Employer approve
            if (!job.isOwnedBy(userId)) {
                throw new UnauthorizedAccessException("Chỉ người đăng việc mới có quyền xác nhận");
            }
        } else {
            // Employer tạo → Freelancer approve
            boolean isAcceptedFreelancer = jobApplicationRepository
                    .existsByJobIdAndFreelancerIdAndStatus(job.getId(), userId, EApplicationStatus.ACCEPTED);
            if (!isAcceptedFreelancer) {
                throw new UnauthorizedAccessException("Chỉ freelancer của công việc này mới có quyền xác nhận");
            }
        }

        // Approve request
        request.approve(user, req != null ? req.getMessage() : null);
        withdrawalRequestRepository.save(request);

        // Hủy job
        job.setStatus(EJobStatus.CANCELLED);
        jobRepository.save(job);

        // Hoàn tiền escrow cho employer (trừ phí phạt đã trừ của người tạo yêu cầu)
        User employer = job.getEmployer();
        BigDecimal escrowAmount = job.getEscrowAmount();
        if (escrowAmount != null && escrowAmount.compareTo(BigDecimal.ZERO) > 0) {
            employer.addBalance(escrowAmount);
            userService.save(employer);
        }

        // Ghi lịch sử
        String description = request.isFreelancerRequest()
                ? "Đã chấp nhận yêu cầu rút của " + request.getRequester().getFullName()
                : "Đã chấp nhận yêu cầu hủy của " + request.getRequester().getFullName();
        jobHistoryService.logHistory(job, user, EJobHistoryAction.WITHDRAWAL_APPROVED, description);
        jobHistoryService.logHistory(job, user, EJobHistoryAction.JOB_CANCELLED, "Công việc đã bị hủy");

        // Thông báo cho người tạo yêu cầu
        notificationService.notifyWithdrawalApproved(request.getRequester(), job, user);
        
        // Thông báo cho employer về việc job bị hủy và hoàn tiền escrow
        notificationService.notifyJobCancelled(employer, job);

        return ApiResponse.success("Đã chấp nhận yêu cầu. Công việc đã được hủy.",
                WithdrawalRequestResponse.fromEntity(request));
    }

    /**
     * Từ chối yêu cầu rút/hủy
     */
    @Transactional
    public ApiResponse<WithdrawalRequestResponse> rejectRequest(Long requestId, Long userId, RespondWithdrawalRequest req) {
        User user = userService.getById(userId);
        WithdrawalRequest request = getRequestById(requestId);

        if (!request.isPending()) {
            throw new IllegalStateException("Yêu cầu này đã được xử lý");
        }

        // Kiểm tra quyền
        Job job = request.getJob();
        if (request.isFreelancerRequest()) {
            if (!job.isOwnedBy(userId)) {
                throw new UnauthorizedAccessException("Chỉ người đăng việc mới có quyền từ chối");
            }
        } else {
            boolean isAcceptedFreelancer = jobApplicationRepository
                    .existsByJobIdAndFreelancerIdAndStatus(job.getId(), userId, EApplicationStatus.ACCEPTED);
            if (!isAcceptedFreelancer) {
                throw new UnauthorizedAccessException("Chỉ freelancer của công việc này mới có quyền từ chối");
            }
        }

        // Reject request
        request.reject(user, req != null ? req.getMessage() : null);
        withdrawalRequestRepository.save(request);

        // Hoàn tiền phạt cho người tạo yêu cầu
        User requester = request.getRequester();
        requester.addBalance(request.getPenaltyFee());
        userService.save(requester);

        // Ghi lịch sử
        String description = request.isFreelancerRequest()
                ? "Đã từ chối yêu cầu rút của " + requester.getFullName()
                : "Đã từ chối yêu cầu hủy của " + requester.getFullName();
        jobHistoryService.logHistory(job, user, EJobHistoryAction.WITHDRAWAL_REJECTED, description);

        // Thông báo cho người tạo yêu cầu
        notificationService.notifyWithdrawalRejected(requester, job, user);

        return ApiResponse.success("Đã từ chối yêu cầu. Tiền phạt đã được hoàn lại cho người yêu cầu.",
                WithdrawalRequestResponse.fromEntity(request));
    }

    /**
     * Người tạo hủy yêu cầu của mình
     */
    @Transactional
    public ApiResponse<Void> cancelRequest(Long requestId, Long userId) {
        WithdrawalRequest request = getRequestById(requestId);

        if (!request.isPending()) {
            throw new IllegalStateException("Yêu cầu này đã được xử lý");
        }

        if (!request.getRequester().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền hủy yêu cầu này");
        }

        // Hủy yêu cầu
        request.cancel();
        withdrawalRequestRepository.save(request);

        // Ghi lịch sử
        User user = userService.getById(userId);
        Job job = request.getJob();
        String description = request.isFreelancerRequest()
                ? "Đã hủy yêu cầu rút"
                : "Đã hủy yêu cầu hủy công việc";
        jobHistoryService.logHistory(job, user, EJobHistoryAction.WITHDRAWAL_CANCELLED, description);

        // KHÔNG hoàn tiền phạt khi tự hủy
        return ApiResponse.success("Đã hủy yêu cầu. Lưu ý: Tiền phạt không được hoàn lại.", null);
    }

    /**
     * Lấy yêu cầu pending của job
     */
    public ApiResponse<WithdrawalRequestResponse> getPendingRequest(Long jobId, Long userId) {
        Job job = getJobById(jobId);

        // Kiểm tra quyền xem
        boolean isEmployer = job.isOwnedBy(userId);
        boolean isAcceptedFreelancer = jobApplicationRepository
                .existsByJobIdAndFreelancerIdAndStatus(jobId, userId, EApplicationStatus.ACCEPTED);

        if (!isEmployer && !isAcceptedFreelancer) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin này");
        }

        WithdrawalRequest request = withdrawalRequestRepository
                .findByJobIdAndStatus(jobId, EWithdrawalRequestStatus.PENDING)
                .orElse(null);

        if (request == null) {
            return ApiResponse.success("Không có yêu cầu nào", null);
        }

        return ApiResponse.success("Thành công", WithdrawalRequestResponse.fromEntity(request));
    }

    /**
     * Lấy lịch sử yêu cầu của job
     */
    public ApiResponse<List<WithdrawalRequestResponse>> getJobRequests(Long jobId, Long userId) {
        Job job = getJobById(jobId);

        boolean isEmployer = job.isOwnedBy(userId);
        boolean isAcceptedFreelancer = jobApplicationRepository
                .existsByJobIdAndFreelancerIdAndStatus(jobId, userId, EApplicationStatus.ACCEPTED);

        if (!isEmployer && !isAcceptedFreelancer) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin này");
        }

        List<WithdrawalRequest> requests = withdrawalRequestRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        List<WithdrawalRequestResponse> responses = requests.stream()
                .map(WithdrawalRequestResponse::fromEntity)
                .collect(Collectors.toList());

        return ApiResponse.success("Thành công", responses);
    }

    private Job getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy công việc"));
    }

    private WithdrawalRequest getRequestById(Long requestId) {
        return withdrawalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu"));
    }

    private User getAcceptedFreelancer(Long jobId) {
        return jobApplicationRepository.findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .map(JobApplication::getFreelancer)
                .orElse(null);
    }
}
