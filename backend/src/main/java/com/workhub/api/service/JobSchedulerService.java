package com.workhub.api.service;

import com.workhub.api.entity.*;
import com.workhub.api.repository.DisputeRepository;
import com.workhub.api.repository.DisputeRoundRepository;
import com.workhub.api.repository.JobApplicationRepository;
import com.workhub.api.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobSchedulerService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final DisputeRepository disputeRepository;
    private final DisputeRoundRepository disputeRoundRepository;
    private final NotificationService notificationService;
    private final JobHistoryService jobHistoryService;
    private final DisputeService disputeService;
    private final BlockchainService blockchainService;

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void checkDeadlines() {
        checkApplicationDeadlinesInternal();
        checkSigningDeadlinesInternal();
        checkWorkSubmissionDeadlinesInternal();
        checkWorkReviewDeadlinesInternal();
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void checkDisputeDeadlines() {
        checkEvidenceDeadlinesInternal();
        checkAdminVoteDeadlinesInternal();
    }

    private void checkEvidenceDeadlinesInternal() {
        LocalDateTime now = LocalDateTime.now();
        List<Dispute> expiredDisputes = disputeRepository.findExpiredEvidenceDeadlines(
                EDisputeStatus.PENDING_FREELANCER_RESPONSE, now);

        for (Dispute dispute : expiredDisputes) {
            try {
                if (dispute.getBlockchainDisputeId() != null && blockchainService.isInitialized()) {
                    String txHash = blockchainService.signResolveDisputeTimeout(dispute.getBlockchainDisputeId());
                    disputeService.markAutoResolved(dispute, txHash);
                    log.info("Dispute {} auto-resolved - TX: {}", dispute.getId(), txHash);
                } else {
                    disputeService.markEvidenceTimeout(dispute);
                }
            } catch (Exception e) {
                log.error("Dispute {} auto-resolve failed: {}", dispute.getId(), e.getMessage());
                disputeService.markEvidenceTimeout(dispute);
            }
        }
    }

    private void checkAdminVoteDeadlinesInternal() {
        LocalDateTime now = LocalDateTime.now();
        List<DisputeRound> expiredRounds = disputeRoundRepository.findByStatusAndVoteDeadlineBefore(
                EDisputeRoundStatus.PENDING_ADMIN, now);

        for (DisputeRound round : expiredRounds) {
            try {
                disputeService.handleAdminTimeout(round);
            } catch (Exception e) {
                log.error("Admin timeout error for round {}: {}", round.getId(), e.getMessage());
            }
        }
    }

    private void checkApplicationDeadlinesInternal() {
        LocalDateTime now = LocalDateTime.now();
        List<Job> expiredJobs = jobRepository.findByStatusAndApplicationDeadlineBefore(EJobStatus.OPEN, now);

        for (Job job : expiredJobs) {
            try {
                processApplicationDeadlineExpired(job);
            } catch (Exception e) {
                log.error("Application deadline error for job {}: {}", job.getId(), e.getMessage());
            }
        }
    }

    private void processApplicationDeadlineExpired(Job job) {
        User employer = job.getEmployer();
        String employerName = employer.getFullName();

        if (job.getEscrowId() != null && blockchainService.isInitialized()) {
            try {
                String txHash = blockchainService.signRefundExpiredJob(job.getEscrowId());
                log.info("Job {} application expired - Refunded to poster - TX: {}", job.getId(), txHash);
                
                job.setStatus(EJobStatus.EXPIRED);
                job.setRefundTxHash(txHash);
                
                jobHistoryService.logHistory(job, employer, EJobHistoryAction.JOB_EXPIRED,
                        "Hết hạn ứng tuyển. Đã hoàn tiền cho " + employerName);
                notificationService.notifyJobExpired(employer, job);
            } catch (Exception e) {
                log.error("Blockchain refund failed for job {}: {}", job.getId(), e.getMessage());
                job.setStatus(EJobStatus.EXPIRED);
                
                jobHistoryService.logHistory(job, employer, EJobHistoryAction.JOB_EXPIRED,
                        "Hết hạn ứng tuyển. Hoàn tiền blockchain thất bại: " + e.getMessage());
                notificationService.notifyBlockchainFailed(employer, job, "hoàn tiền hết hạn ứng tuyển");
            }
        } else {
            job.setStatus(EJobStatus.EXPIRED);
            jobHistoryService.logHistory(job, employer, EJobHistoryAction.JOB_EXPIRED,
                    "Hết hạn ứng tuyển.");
            notificationService.notifyJobExpired(employer, job);
        }
        
        jobRepository.save(job);
    }

    private void checkSigningDeadlinesInternal() {
        LocalDateTime deadline = LocalDateTime.now().minusSeconds(90);
        List<Job> overdueJobs = jobRepository.findByStatusAndAcceptedAtBefore(EJobStatus.PENDING_SIGNATURE, deadline);

        for (Job job : overdueJobs) {
            try {
                processSigningTimeout(job);
            } catch (Exception e) {
                log.error("Signing timeout error for job {}: {}", job.getId(), e.getMessage());
            }
        }
    }

    private void processSigningTimeout(Job job) {
        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(job.getId(), EApplicationStatus.ACCEPTED)
                .orElse(null);
        if (application == null) return;

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        String freelancerName = freelancer.getFullName();

        if (job.getEscrowId() != null && blockchainService.isInitialized()) {
            try {
                String txHash = blockchainService.signRemoveFreelancerSigningTimeout(job.getEscrowId());
                log.info("Job {} signing timeout - Freelancer removed - TX: {}", job.getId(), txHash);
                
                job.setStatus(EJobStatus.OPEN);
                job.setFreelancerWalletAddress(null);
                application.setStatus(EApplicationStatus.REJECTED);
                jobApplicationRepository.save(application);
                jobRepository.save(job);

                jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.FREELANCER_TIMEOUT,
                        freelancerName + " không ký hợp đồng trong 1p30s. Đã xóa khỏi blockchain.");
                notificationService.notifySigningTimeout(freelancer, job);
                notificationService.notifyEmployerCanRemoveFreelancer(employer, job);
            } catch (Exception e) {
                log.error("Blockchain signing failed for job {}: {}", job.getId(), e.getMessage());
                job.setStatus(EJobStatus.SIGNING_TIMEOUT);
                jobRepository.save(job);

                jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.FREELANCER_TIMEOUT,
                        freelancerName + " không ký hợp đồng. Blockchain thất bại: " + e.getMessage());
                notificationService.notifySigningTimeout(freelancer, job);
                notificationService.notifyBlockchainFailed(employer, job, "xóa freelancer quá hạn ký");
            }
        } else {
            job.setStatus(EJobStatus.SIGNING_TIMEOUT);
            jobRepository.save(job);

            jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.FREELANCER_TIMEOUT,
                    freelancerName + " không ký hợp đồng trong 1p30s.");
            notificationService.notifySigningTimeout(freelancer, job);
            notificationService.notifyEmployerCanRemoveFreelancer(employer, job);
        }
    }

    private void checkWorkSubmissionDeadlinesInternal() {
        LocalDateTime now = LocalDateTime.now();
        List<Job> overdueJobs = jobRepository.findByStatusAndWorkSubmissionDeadlineBefore(EJobStatus.IN_PROGRESS, now);

        for (Job job : overdueJobs) {
            try {
                processFreelancerSubmissionTimeout(job);
            } catch (Exception e) {
                log.error("Submission timeout error for job {}: {}", job.getId(), e.getMessage());
            }
        }
    }

    private void checkWorkReviewDeadlinesInternal() {
        LocalDateTime now = LocalDateTime.now();
        List<Job> overdueJobs = jobRepository.findByStatusAndWorkReviewDeadlineBefore(EJobStatus.IN_PROGRESS, now);

        for (Job job : overdueJobs) {
            try {
                processEmployerReviewTimeout(job);
            } catch (Exception e) {
                log.error("Review timeout error for job {}: {}", job.getId(), e.getMessage());
            }
        }
    }

    private void processFreelancerSubmissionTimeout(Job job) {
        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(job.getId(), EApplicationStatus.ACCEPTED)
                .orElse(null);
        if (application == null || application.isWorkSubmitted()) return;

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        String freelancerName = freelancer.getFullName();

        if (job.getEscrowId() != null && blockchainService.isInitialized()) {
            try {
                String txHash = blockchainService.signRemoveFreelancerSubmissionTimeout(job.getEscrowId());
                log.info("Job {} submission timeout - Freelancer removed - TX: {}", job.getId(), txHash);
                
                job.setStatus(EJobStatus.OPEN);
                job.setFreelancerWalletAddress(null);
                job.clearDeadlines();
                application.setStatus(EApplicationStatus.REJECTED);
                application.clearWorkSubmission();
                jobApplicationRepository.save(application);
                jobRepository.save(job);

                jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.FREELANCER_TIMEOUT,
                        freelancerName + " không nộp sản phẩm đúng hạn. Đã xóa khỏi blockchain.");
                notificationService.notifyWorkSubmissionTimeout(freelancer, job);
                notificationService.notifyEmployerCanRemoveFreelancer(employer, job);
            } catch (Exception e) {
                log.error("Blockchain submission timeout failed for job {}: {}", job.getId(), e.getMessage());
                job.setStatus(EJobStatus.WORK_TIMEOUT);
                jobRepository.save(job);

                jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.FREELANCER_TIMEOUT,
                        freelancerName + " không nộp sản phẩm. Blockchain thất bại: " + e.getMessage());
                notificationService.notifyWorkSubmissionTimeout(freelancer, job);
                notificationService.notifyBlockchainFailed(employer, job, "xóa freelancer quá hạn nộp");
            }
        } else {
            job.setStatus(EJobStatus.WORK_TIMEOUT);
            jobRepository.save(job);

            jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.FREELANCER_TIMEOUT,
                    freelancerName + " không nộp sản phẩm đúng hạn.");
            notificationService.notifyWorkSubmissionTimeout(freelancer, job);
            notificationService.notifyEmployerCanRemoveFreelancer(employer, job);
        }
    }

    private void processEmployerReviewTimeout(Job job) {
        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(job.getId(), EApplicationStatus.ACCEPTED)
                .orElse(null);
        if (application == null || !application.isWorkSubmitted()) return;
        if (application.getWorkStatus() == EWorkStatus.APPROVED) return;

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        String employerName = employer.getFullName();
        BigDecimal payment = job.getBudget();

        if (job.getEscrowId() != null && blockchainService.isInitialized()) {
            try {
                String txHash = blockchainService.signAutoApproveReviewTimeout(job.getEscrowId());
                log.info("Job {} review timeout - Auto approved & paid - TX: {}", job.getId(), txHash);
                
                application.approveWork();
                jobApplicationRepository.save(application);
                
                job.complete();
                job.clearDeadlines();
                job.setPaymentTxHash(txHash);
                jobRepository.save(job);

                jobHistoryService.logHistory(job, employer, EJobHistoryAction.AUTO_APPROVED,
                        "Tự động duyệt do " + employerName + " không duyệt đúng hạn.");
                jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.JOB_COMPLETED,
                        "Công việc hoàn thành. Thanh toán " + payment.toPlainString() + " " + job.getCurrency());

                notificationService.notifyAutoApproved(freelancer, job, payment.toPlainString() + " " + job.getCurrency());
                notificationService.notifyWorkReviewTimeout(employer, job);
                notificationService.notifyJobCompleted(freelancer, job);
                notificationService.notifyJobCompleted(employer, job);
                
                return;
            } catch (Exception e) {
                log.error("Blockchain review timeout failed for job {}: {}", job.getId(), e.getMessage());
                
                job.setStatus(EJobStatus.REVIEW_TIMEOUT);
                jobRepository.save(job);

                jobHistoryService.logHistory(job, employer, EJobHistoryAction.EMPLOYER_TIMEOUT,
                        employerName + " không duyệt sản phẩm. Blockchain thất bại: " + e.getMessage());
                notificationService.notifyWorkReviewTimeout(employer, job);
                notificationService.notifyBlockchainFailed(freelancer, job, "tự động duyệt quá hạn");
                notificationService.notifyFreelancerCanClaimPayment(freelancer, job);
                return;
            }
        }
        
        job.setStatus(EJobStatus.REVIEW_TIMEOUT);
        jobRepository.save(job);

        jobHistoryService.logHistory(job, employer, EJobHistoryAction.EMPLOYER_TIMEOUT,
                employerName + " không duyệt sản phẩm đúng hạn.");
        notificationService.notifyWorkReviewTimeout(employer, job);
        notificationService.notifyFreelancerCanClaimPayment(freelancer, job);
    }
}
