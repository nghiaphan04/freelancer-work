package com.workhub.api.service;

import com.workhub.api.dto.request.AdminVoteRequest;
import com.workhub.api.dto.request.CreateDisputeRequest;
import com.workhub.api.dto.request.DisputeResponseRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.DisputeResponse;
import com.workhub.api.dto.response.DisputeRoundResponse;
import com.workhub.api.dto.response.FileUploadResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.UnauthorizedAccessException;
import com.workhub.api.repository.DisputeRepository;
import com.workhub.api.repository.DisputeRoundRepository;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final DisputeRoundRepository disputeRoundRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobService jobService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final JobHistoryService jobHistoryService;
    private final FileUploadService fileUploadService;
    private final AdminSelectionService adminSelectionService;
    private final BlockchainService blockchainService;

    // FOR TESTING: 48h -> 3 minutes, 24h -> 1.5 minutes
    private static final int EVIDENCE_DEADLINE_SECONDS = 180; // 3 minutes (was 48h)
    private static final int VOTE_DEADLINE_SECONDS = 180; // 3 minutes (was 48h)

    @Transactional
    public ApiResponse<DisputeResponse> createDispute(Long jobId, Long userId, CreateDisputeRequest req, String txHash) {
        Job job = jobService.getById(jobId);
        User employer = userService.getById(userId);

        if (req.getWalletAddress() != null && !req.getWalletAddress().isEmpty()) {
            employer.setWalletAddress(req.getWalletAddress());
            userService.save(employer);
        }

        if (!job.isOwnedBy(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải người đăng công việc này");
        }

        if (!job.isInProgress()) {
            throw new IllegalStateException("Chỉ có thể tạo khiếu nại khi công việc đang thực hiện");
        }

        List<EDisputeStatus> activeStatuses = List.of(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE,
                EDisputeStatus.VOTING_ROUND_1,
                EDisputeStatus.VOTING_ROUND_2,
                EDisputeStatus.VOTING_ROUND_3
        );
        if (disputeRepository.existsByJobIdAndStatusIn(jobId, activeStatuses)) {
            throw new IllegalStateException("Công việc này đã có khiếu nại đang xử lý");
        }

        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(jobId, EApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy freelancer đang làm"));
        User freelancer = application.getFreelancer();

        if (!application.isWorkSubmitted()) {
            throw new IllegalStateException("Chỉ có thể tạo khiếu nại sau khi freelancer đã nộp sản phẩm");
        }

        Dispute dispute = Dispute.builder()
                .job(job)
                .employer(employer)
                .freelancer(freelancer)
                .employerEvidenceUrl(req.getEvidenceUrl())
                .employerEvidenceFileId(req.getFileId())
                .employerDescription(req.getDescription())
                .status(EDisputeStatus.PENDING_FREELANCER_RESPONSE)
                .currentRound(0)
                .rounds(new ArrayList<>())
                .build();

        dispute.setEvidenceDeadlineSeconds(EVIDENCE_DEADLINE_SECONDS);

        job.dispute();
        jobRepository.save(job);

        Dispute saved = disputeRepository.save(dispute);
        
        if (req.getFileId() != null) {
            fileUploadService.assignFileToReference(req.getFileId(), "DISPUTE", saved.getId());
        }

        // Use blockchain dispute ID from frontend (parsed from event)
        if (req.getBlockchainDisputeId() != null && req.getBlockchainDisputeId() > 0) {
            saved.setBlockchainDisputeId(req.getBlockchainDisputeId());
            disputeRepository.save(saved);
            log.info("Set blockchain dispute ID {} for dispute {} (from frontend)", 
                    req.getBlockchainDisputeId(), saved.getId());
        } else {
            log.warn("No blockchain dispute ID provided - user may not have signed transaction");
        }

        jobHistoryService.logHistory(job, employer, EJobHistoryAction.DISPUTE_CREATED,
                "Đã tạo khiếu nại: " + req.getDescription());

        notificationService.notifyDisputeCreated(freelancer, job, employer);

        return ApiResponse.success("Đã tạo khiếu nại. Freelancer có 3 phút để phản hồi.", buildResponse(saved));
    }

    @Transactional
    public ApiResponse<DisputeResponse> submitFreelancerResponse(Long disputeId, Long userId, DisputeResponseRequest req) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));

        if (!dispute.getFreelancer().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Bạn không phải freelancer của khiếu nại này");
        }

        if (!dispute.isPendingFreelancerResponse()) {
            throw new IllegalStateException("Không thể gửi phản hồi ở trạng thái này");
        }

        if (dispute.isEvidenceDeadlineExpired()) {
            throw new IllegalStateException("Đã quá hạn gửi phản hồi");
        }

        dispute.setFreelancerEvidenceUrl(req.getEvidenceUrl());
        dispute.setFreelancerDescription(req.getDescription());
        dispute.setFreelancerEvidenceFileId(req.getFileId());
        
        Dispute saved = disputeRepository.save(dispute);
        
        if (req.getFileId() != null) {
            fileUploadService.assignFileToReference(req.getFileId(), "DISPUTE", dispute.getId());
        }

        Job job = dispute.getJob();
        User freelancer = dispute.getFreelancer();
        jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.DISPUTE_RESPONSE_SUBMITTED,
                "Freelancer đã gửi phản hồi khiếu nại");

        notificationService.notifyDisputeResponseSubmitted(dispute.getEmployer(), job, freelancer);

        startVotingProcess(dispute);

        return ApiResponse.success("Đã gửi phản hồi. Bắt đầu quá trình voting.", buildResponse(saved));
    }

    @Transactional
    public void startVotingProcess(Dispute dispute) {
        dispute.startVoting();
        disputeRepository.save(dispute);
        createRound(dispute, 1);
        log.info("Started voting process for dispute {}", dispute.getId());
    }

    @Transactional
    public DisputeRound createRound(Dispute dispute, int roundNumber) {
        List<Long> usedAdminIds = adminSelectionService.getUsedAdminIds(dispute.getId());
        User admin = adminSelectionService.selectAdminForRound(dispute.getId(), roundNumber, usedAdminIds);

        DisputeRound round = DisputeRound.builder()
                .dispute(dispute)
                .roundNumber(roundNumber)
                .admin(admin)
                .adminWallet(admin.getWalletAddress())
                .selectedAt(LocalDateTime.now())
                .voteDeadline(LocalDateTime.now().plusSeconds(VOTE_DEADLINE_SECONDS))
                .status(EDisputeRoundStatus.PENDING_ADMIN)
                .reselectionCount(0)
                .build();

        DisputeRound saved = disputeRoundRepository.save(round);
        dispute.getRounds().add(saved);

        notificationService.notifyAdminSelectedForDispute(admin, dispute.getJob(), roundNumber);

        log.info("Created round {} for dispute {} with admin {}", roundNumber, dispute.getId(), admin.getId());
        return saved;
    }

    @Transactional
    public ApiResponse<DisputeRoundResponse> submitAdminVote(Long disputeId, Long adminId, AdminVoteRequest request) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));
        User admin = userService.getById(adminId);

        if (!admin.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền admin");
        }

        if (!dispute.isVoting()) {
            throw new IllegalStateException("Khiếu nại không ở trạng thái voting");
        }

        int currentRound = dispute.getCurrentRound();
        DisputeRound round = disputeRoundRepository
                .findByDisputeIdAndRoundNumber(disputeId, currentRound)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy round hiện tại"));

        if (!round.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedAccessException("Bạn không phải admin được chọn cho round này");
        }

        if (round.isVoted()) {
            throw new IllegalStateException("Round này đã được vote");
        }

        String winnerWallet = request.isEmployerWins() 
                ? dispute.getEmployer().getWalletAddress()
                : dispute.getFreelancer().getWalletAddress();

        round.markAsVoted(winnerWallet, request.isEmployerWins(), request.getTxHash());
        disputeRoundRepository.save(round);

        dispute.setRoundWinner(currentRound, winnerWallet);
        disputeRepository.save(dispute);

        jobHistoryService.logHistory(dispute.getJob(), admin, EJobHistoryAction.DISPUTE_ROUND_VOTED,
                "Admin " + admin.getFullName() + " đã vote round " + currentRound + 
                " cho " + (request.isEmployerWins() ? "Employer" : "Freelancer"));

        if (canFinalizeEarly(dispute) || currentRound >= 3) {
            finalizeDispute(dispute);
        } else {
            dispute.advanceToNextRound();
            disputeRepository.save(dispute);
            createRound(dispute, currentRound + 1);
        }

        return ApiResponse.success("Vote thành công", DisputeRoundResponse.fromEntity(round));
    }

    private boolean canFinalizeEarly(Dispute dispute) {
        int employerVotes = dispute.countEmployerVotes();
        int freelancerVotes = dispute.countFreelancerVotes();
        return employerVotes >= 2 || freelancerVotes >= 2;
    }

    @Transactional
    public void finalizeDispute(Dispute dispute) {
        dispute.finalizeResult();
        
        // Smart contract auto-transfers funds when 2/3 majority, so mark as CLAIMED directly
        EDisputeStatus claimedStatus = Boolean.TRUE.equals(dispute.getEmployerWins()) 
                ? EDisputeStatus.EMPLOYER_CLAIMED : EDisputeStatus.FREELANCER_CLAIMED;
        dispute.setStatus(claimedStatus);
        disputeRepository.save(dispute);

        Job job = dispute.getJob();
        job.setStatus(EJobStatus.COMPLETED);
        job.clearDeadlines();
        jobRepository.save(job);

        User winner = Boolean.TRUE.equals(dispute.getEmployerWins()) 
                ? dispute.getEmployer() : dispute.getFreelancer();
        User loser = Boolean.TRUE.equals(dispute.getEmployerWins()) 
                ? dispute.getFreelancer() : dispute.getEmployer();

        int winnerVotes = Boolean.TRUE.equals(dispute.getEmployerWins()) 
                ? dispute.countEmployerVotes() : dispute.countFreelancerVotes();

        notificationService.notifyDisputeResolvedWin(winner, job, job.getBudget() + " APT");
        notificationService.notifyDisputeResolvedLose(loser, job);

        jobHistoryService.logHistory(job, winner, EJobHistoryAction.DISPUTE_RESOLVED,
                "Tranh chấp đã được giải quyết. " + winner.getFullName() + " thắng với " +
                winnerVotes + "/3 votes. Tiền đã tự động chuyển.");

        log.info("Finalized dispute {} - Winner: {} - funds auto-transferred by smart contract", dispute.getId(), winner.getFullName());
    }

    @Transactional
    public void markEvidenceTimeout(Dispute dispute) {
        Job job = dispute.getJob();
        User employer = dispute.getEmployer();
        User freelancer = dispute.getFreelancer();

        // Backend auto-signs to resolve and transfer funds to employer
        if (dispute.getBlockchainDisputeId() != null && blockchainService.isInitialized()) {
            try {
                String txHash = blockchainService.signResolveDisputeTimeout(dispute.getBlockchainDisputeId());
                
                dispute.setStatus(EDisputeStatus.EMPLOYER_CLAIMED);
                dispute.setResolutionTxHash(txHash);
                dispute.setEmployerWins(true);
                disputeRepository.save(dispute);

                job.setStatus(EJobStatus.COMPLETED);
                job.clearDeadlines();
                jobRepository.save(job);

                notificationService.notifyDisputeResolvedWin(employer, job, job.getBudget() + " APT");
                notificationService.notifyLostDueToTimeout(freelancer, job);

                jobHistoryService.logHistory(job, employer, EJobHistoryAction.DISPUTE_TIMEOUT,
                        "Freelancer không phản hồi. Employer tự động thắng và nhận tiền. TX: " + txHash);

                log.info("Evidence timeout for dispute {} - auto-transferred to employer - TX: {}", dispute.getId(), txHash);
            } catch (Exception e) {
                log.error("Failed to auto-resolve timeout dispute {}: {}", dispute.getId(), e.getMessage());
                
                // Fallback: mark as timeout, let user claim manually
                dispute.setStatus(EDisputeStatus.EVIDENCE_TIMEOUT);
                disputeRepository.save(dispute);

                notificationService.notifyCanClaimTimeoutWin(employer, job);
                notificationService.notifyLostDueToTimeout(freelancer, job);

                jobHistoryService.logHistory(job, employer, EJobHistoryAction.DISPUTE_TIMEOUT,
                        "Freelancer không phản hồi. Auto-resolve failed: " + e.getMessage());
            }
        } else {
            dispute.setStatus(EDisputeStatus.EVIDENCE_TIMEOUT);
            disputeRepository.save(dispute);

            notificationService.notifyCanClaimTimeoutWin(employer, job);
            notificationService.notifyLostDueToTimeout(freelancer, job);

            jobHistoryService.logHistory(job, employer, EJobHistoryAction.DISPUTE_TIMEOUT,
                    "Freelancer không phản hồi. Blockchain không khả dụng.");

            log.warn("Evidence timeout for dispute {} - no blockchain available", dispute.getId());
        }
    }

    @Transactional
    public void markAutoResolved(Dispute dispute, String txHash) {
        dispute.setStatus(EDisputeStatus.EMPLOYER_CLAIMED);
        dispute.setResolutionTxHash(txHash);
        dispute.setEmployerWins(true);
        disputeRepository.save(dispute);

        Job job = dispute.getJob();
        job.setStatus(EJobStatus.COMPLETED);
        job.clearDeadlines();
        jobRepository.save(job);

        User employer = dispute.getEmployer();
        User freelancer = dispute.getFreelancer();

        notificationService.notifyDisputeResolvedWin(employer, job, job.getBudget() + " APT");
        notificationService.notifyDisputeResolvedLose(freelancer, job);

        jobHistoryService.logHistory(job, employer, EJobHistoryAction.DISPUTE_REFUND_CLAIMED,
                "Freelancer không phản hồi. Employer thắng và đã nhận " + job.getBudget() + " APT. TX: " + txHash);
    }

    @Transactional
    public ApiResponse<DisputeResponse> claimTimeoutWin(Long disputeId, Long userId, String txHash) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));

        if (!dispute.getEmployer().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Chỉ employer có thể claim timeout win");
        }

        if (dispute.getStatus() != EDisputeStatus.EVIDENCE_TIMEOUT) {
            throw new IllegalStateException("Không thể claim ở trạng thái này");
        }

        dispute.setStatus(EDisputeStatus.EMPLOYER_WON);
        dispute.setResolutionTxHash(txHash);
        disputeRepository.save(dispute);

        Job job = dispute.getJob();
        
        notificationService.notifyDisputeResolvedWin(dispute.getEmployer(), job, job.getBudget() + " APT");
        notificationService.notifyDisputeResolvedLose(dispute.getFreelancer(), job);

        jobHistoryService.logHistory(job, dispute.getEmployer(), EJobHistoryAction.DISPUTE_RESOLVED,
                "Employer thắng do freelancer không phản hồi. TX: " + txHash);

        log.info("Employer claimed timeout win for dispute {} - TX: {}", dispute.getId(), txHash);

        return ApiResponse.success("Đã claim thắng thành công!", buildResponse(dispute));
    }

    @Transactional
    public ApiResponse<DisputeResponse> claimRefund(Long disputeId, Long userId, String txHash) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));

        boolean isEmployerWinner = dispute.getStatus() == EDisputeStatus.EMPLOYER_WON;
        boolean isFreelancerWinner = dispute.getStatus() == EDisputeStatus.FREELANCER_WON;

        if (!isEmployerWinner && !isFreelancerWinner) {
            throw new IllegalStateException("Tranh chấp chưa được giải quyết");
        }

        User winner = isEmployerWinner ? dispute.getEmployer() : dispute.getFreelancer();
        if (!winner.getId().equals(userId)) {
            throw new UnauthorizedAccessException("Chỉ người thắng có thể nhận tiền");
        }

        dispute.setStatus(isEmployerWinner ? EDisputeStatus.EMPLOYER_CLAIMED : EDisputeStatus.FREELANCER_CLAIMED);
        dispute.setResolutionTxHash(txHash);
        disputeRepository.save(dispute);

        Job job = dispute.getJob();
        job.setStatus(EJobStatus.COMPLETED);
        job.clearDeadlines();
        jobRepository.save(job);

        jobHistoryService.logHistory(job, winner, EJobHistoryAction.DISPUTE_REFUND_CLAIMED,
                winner.getFullName() + " đã nhận tiền hoàn trả. TX: " + txHash);

        log.info("Winner {} claimed refund for dispute {} - TX: {}", winner.getId(), dispute.getId(), txHash);

        return ApiResponse.success("Đã nhận tiền thành công!", buildResponse(dispute));
    }

    @Transactional
    public void handleAdminTimeout(DisputeRound round) {
        Dispute dispute = round.getDispute();
        User timedOutAdmin = round.getAdmin();

        round.setStatus(EDisputeRoundStatus.ADMIN_TIMEOUT);
        disputeRoundRepository.save(round);

        User newAdmin = adminSelectionService.selectReplacementAdmin(
                dispute.getId(), 
                round.getRoundNumber(), 
                timedOutAdmin.getId()
        );

        round.reassignAdminSeconds(newAdmin, VOTE_DEADLINE_SECONDS);
        disputeRoundRepository.save(round);

        notificationService.notifyAdminVoteTimeout(timedOutAdmin, dispute.getJob(), round.getRoundNumber());
        notificationService.notifyAdminSelectedForDispute(newAdmin, dispute.getJob(), round.getRoundNumber());

        log.info("Admin timeout for dispute {} round {}. Reassigned to admin {}", 
                dispute.getId(), round.getRoundNumber(), newAdmin.getId());
    }


    public ApiResponse<DisputeResponse> getDisputeByJobId(Long jobId, Long userId) {
        Job job = jobService.getById(jobId);
        User user = userService.getById(userId);

        boolean isEmployer = job.isOwnedBy(userId);
        boolean isFreelancer = jobApplicationRepository.existsByJobIdAndFreelancerIdAndStatus(
                jobId, userId, EApplicationStatus.ACCEPTED);
        boolean isAdmin = user.isAdmin();

        if (!isEmployer && !isFreelancer && !isAdmin) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin này");
        }

        Dispute dispute = disputeRepository.findByJobId(jobId).orElse(null);

        if (dispute == null) {
            return ApiResponse.success("Không có khiếu nại", null);
        }

        return ApiResponse.success("Thành công", buildResponse(dispute));
    }

    public ApiResponse<List<DisputeRoundResponse>> getDisputeRounds(Long disputeId, Long userId) {
        User user = userService.getById(userId);
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khiếu nại"));

        boolean isEmployer = dispute.getEmployer().getId().equals(userId);
        boolean isFreelancer = dispute.getFreelancer().getId().equals(userId);
        boolean isAdmin = user.isAdmin();

        if (!isEmployer && !isFreelancer && !isAdmin) {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin này");
        }

        List<DisputeRound> rounds = disputeRoundRepository.findByDisputeIdOrderByRoundNumber(disputeId);
        List<DisputeRoundResponse> responses = rounds.stream()
                .map(DisputeRoundResponse::fromEntity)
                .toList();

        return ApiResponse.success("Thành công", responses);
    }

    public ApiResponse<List<DisputeRoundResponse>> getMyPendingVotes(Long adminId) {
        User admin = userService.getById(adminId);
        if (!admin.isAdmin()) {
            throw new UnauthorizedAccessException("Bạn không có quyền admin");
        }

        List<DisputeRound> pendingRounds = disputeRoundRepository
                .findByAdminIdAndStatus(adminId, EDisputeRoundStatus.PENDING_ADMIN);

        List<DisputeRoundResponse> responses = pendingRounds.stream()
                .map(DisputeRoundResponse::fromEntity)
                .toList();

        return ApiResponse.success("Thành công", responses);
    }

    public ApiResponse<Page<DisputeResponse>> getPendingDisputes(int page, int size) {
        List<EDisputeStatus> pendingStatuses = List.of(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE,
                EDisputeStatus.VOTING_ROUND_1,
                EDisputeStatus.VOTING_ROUND_2,
                EDisputeStatus.VOTING_ROUND_3
        );
        Page<Dispute> disputes = disputeRepository.findByStatusIn(
                pendingStatuses,
                PageRequest.of(page, size, Sort.by("createdAt").ascending())
        );
        return ApiResponse.success("Thành công", disputes.map(this::buildResponse));
    }

    public ApiResponse<Long> countPendingDisputes() {
        List<EDisputeStatus> pendingStatuses = List.of(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE,
                EDisputeStatus.VOTING_ROUND_1,
                EDisputeStatus.VOTING_ROUND_2,
                EDisputeStatus.VOTING_ROUND_3
        );
        long count = disputeRepository.countByStatusIn(pendingStatuses);
        return ApiResponse.success("Thành công", count);
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
