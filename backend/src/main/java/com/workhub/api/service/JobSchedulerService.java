package com.workhub.api.service;

import com.workhub.api.entity.*;
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

/**
 * Service xử lý các tác vụ tự động theo lịch
 * - Kiểm tra freelancer quá hạn nộp sản phẩm
 * - Kiểm tra employer quá hạn review sản phẩm
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobSchedulerService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final JobHistoryService jobHistoryService;

    /**
     * Chạy mỗi 5 phút để kiểm tra các deadline
     */
    @Scheduled(fixedRate = 300000) // 5 phút = 300000 ms
    public void checkDeadlines() {
        log.info("Checking job deadlines...");
        checkWorkSubmissionDeadlines();
        checkWorkReviewDeadlines();
    }

    /**
     * TH2a: Kiểm tra freelancer quá hạn nộp sản phẩm
     * - Clear freelancer
     * - Mở lại job
     * - Thông báo cho cả 2 bên
     * - Freelancer +1 điểm không uy tín
     */
    @Transactional
    public void checkWorkSubmissionDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        
        // Tìm các job IN_PROGRESS có workSubmissionDeadline đã qua
        List<Job> overdueJobs = jobRepository.findByStatusAndWorkSubmissionDeadlineBefore(
                EJobStatus.IN_PROGRESS, now);
        
        for (Job job : overdueJobs) {
            try {
                processFreelancerTimeout(job);
            } catch (Exception e) {
                log.error("Error processing freelancer timeout for job {}: {}", job.getId(), e.getMessage());
            }
        }
        
        if (!overdueJobs.isEmpty()) {
            log.info("Processed {} jobs with freelancer submission timeout", overdueJobs.size());
        }
    }

    /**
     * TH2b: Kiểm tra employer quá hạn review sản phẩm
     * - Auto approve sản phẩm
     * - Thanh toán cho freelancer
     * - Hoàn thành job
     * - Cả 2 bên +1 điểm uy tín
     */
    @Transactional
    public void checkWorkReviewDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        
        // Tìm các job IN_PROGRESS có workReviewDeadline đã qua
        List<Job> overdueJobs = jobRepository.findByStatusAndWorkReviewDeadlineBefore(
                EJobStatus.IN_PROGRESS, now);
        
        for (Job job : overdueJobs) {
            try {
                processEmployerTimeout(job);
            } catch (Exception e) {
                log.error("Error processing employer timeout for job {}: {}", job.getId(), e.getMessage());
            }
        }
        
        if (!overdueJobs.isEmpty()) {
            log.info("Processed {} jobs with employer review timeout", overdueJobs.size());
        }
    }

    /**
     * Xử lý khi freelancer quá hạn nộp sản phẩm
     */
    private void processFreelancerTimeout(Job job) {
        // Tìm freelancer đang làm
        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(job.getId(), EApplicationStatus.ACCEPTED)
                .orElse(null);
        
        if (application == null) {
            log.warn("No accepted application found for job {}", job.getId());
            return;
        }
        
        // Chỉ xử lý nếu freelancer chưa nộp sản phẩm
        if (application.isWorkSubmitted()) {
            log.info("Freelancer already submitted work for job {}, skipping timeout", job.getId());
            return;
        }

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        
        // 1. Clear freelancer - đổi status về REJECTED
        application.setStatus(EApplicationStatus.REJECTED);
        application.clearWorkSubmission();
        jobApplicationRepository.save(application);
        
        // 2. Mở lại job
        job.reopenJob();
        jobRepository.save(job);
        
        // 3. Freelancer +1 điểm không uy tín
        freelancer.addUntrustScore(1);
        userService.save(freelancer);
        
        // 4. Ghi lịch sử
        jobHistoryService.logHistory(job, null, EJobHistoryAction.FREELANCER_TIMEOUT,
                "Freelancer " + freelancer.getFullName() + " không nộp sản phẩm đúng hạn");
        jobHistoryService.logHistory(job, null, EJobHistoryAction.JOB_REOPENED,
                "Công việc được mở lại để tuyển freelancer mới");
        
        // 5. Thông báo cho cả 2 bên
        notificationService.notifyWorkSubmissionTimeout(freelancer, job);
        notificationService.notifyFreelancerCleared(employer, job, freelancer);
        
        log.info("Processed freelancer timeout for job {}: freelancer {} cleared, job reopened",
                job.getId(), freelancer.getId());
    }

    /**
     * Xử lý khi employer quá hạn review sản phẩm
     */
    private void processEmployerTimeout(Job job) {
        // Tìm freelancer đang làm
        JobApplication application = jobApplicationRepository
                .findFirstByJobIdAndStatus(job.getId(), EApplicationStatus.ACCEPTED)
                .orElse(null);
        
        if (application == null) {
            log.warn("No accepted application found for job {}", job.getId());
            return;
        }
        
        // Chỉ xử lý nếu freelancer đã nộp sản phẩm và đang chờ review
        if (!application.isWorkSubmitted()) {
            log.info("Freelancer hasn't submitted work for job {}, skipping review timeout", job.getId());
            return;
        }
        
        // Nếu đã approved rồi thì không xử lý
        if (application.getWorkStatus() == EWorkStatus.APPROVED) {
            log.info("Work already approved for job {}, skipping review timeout", job.getId());
            return;
        }

        User freelancer = application.getFreelancer();
        User employer = job.getEmployer();
        BigDecimal payment = job.getBudget();
        
        // 1. Auto approve work
        application.approveWork();
        jobApplicationRepository.save(application);
        
        // 2. Complete job
        job.complete();
        job.clearDeadlines();
        jobRepository.save(job);
        
        // 3. Thanh toán cho freelancer
        if (payment != null && payment.compareTo(BigDecimal.ZERO) > 0) {
            freelancer.addBalance(payment);
        }
        
        // 4. Cả 2 bên +1 điểm uy tín
        freelancer.addTrustScore(1);
        employer.addTrustScore(1);
        userService.save(freelancer);
        userService.save(employer);
        
        // 5. Ghi lịch sử
        jobHistoryService.logHistory(job, null, EJobHistoryAction.EMPLOYER_TIMEOUT,
                "Employer " + employer.getFullName() + " không duyệt sản phẩm đúng hạn");
        jobHistoryService.logHistory(job, null, EJobHistoryAction.AUTO_APPROVED,
                "Hệ thống tự động duyệt sản phẩm và thanh toán " + payment.toPlainString() + " VND cho freelancer");
        jobHistoryService.logHistory(job, null, EJobHistoryAction.JOB_COMPLETED,
                "Công việc hoàn thành (tự động)");
        
        // 6. Thông báo cho cả 2 bên
        notificationService.notifyWorkReviewTimeout(employer, job);
        notificationService.notifyAutoApproved(freelancer, job, payment.toPlainString());
        notificationService.notifyJobCompleted(freelancer, job);
        notificationService.notifyJobCompleted(employer, job);
        
        log.info("Processed employer timeout for job {}: auto-approved, payment {} released to freelancer {}",
                job.getId(), payment, freelancer.getId());
    }
}
