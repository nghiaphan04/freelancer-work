package com.workhub.api.controller;

import com.workhub.api.dto.request.ApplyJobRequest;
import com.workhub.api.dto.request.CreateJobContractRequest;
import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.RepostJobRequest;
import com.workhub.api.dto.request.RevisionRequest;
import com.workhub.api.dto.request.SubmitWorkRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
import com.workhub.api.dto.response.JobContractResponse;
import com.workhub.api.dto.response.JobHistoryResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.EApplicationStatus;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.BlockchainService;
import com.workhub.api.service.JobApplicationService;
import com.workhub.api.service.JobContractService;
import com.workhub.api.service.JobHistoryService;
import com.workhub.api.service.JobService;
import com.workhub.api.service.JobWorkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final JobApplicationService jobApplicationService;
    private final JobWorkService jobWorkService;
    private final JobHistoryService jobHistoryService;
    private final JobContractService jobContractService;
    private final BlockchainService blockchainService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> createJob(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateJobRequest req) {

        ApiResponse<JobResponse> response = jobService.createJob(userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getOpenJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(jobService.getOpenJobs(page, size, sortBy, sortDir));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<JobResponse>> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobByIdAndIncrementView(id));
    }

    @GetMapping("/my-jobs")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getMyJobs(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EJobStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(jobService.getMyJobs(userDetails.getId(), status, page, size, sortBy, sortDir));
    }

    @GetMapping("/my-working-jobs")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getMyWorkingJobs(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EJobStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(jobService.getFreelancerWorkingJobs(userDetails.getId(), status, page, size, sortBy, sortDir));
    }

    @GetMapping("/my-working-jobs/stats")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobService.FreelancerJobStats>> getMyWorkingJobsStats(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(jobService.getFreelancerJobStats(userDetails.getId()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> searchJobs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobService.searchJobs(keyword, page, size));
    }

    @GetMapping("/by-skills")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getJobsBySkills(
            @RequestParam List<String> skills,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobService.getJobsBySkills(skills, page, size));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateJobRequest req) {

        return ResponseEntity.ok(jobService.updateJob(id, userDetails.getId(), req));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> closeJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.closeJob(id, userDetails.getId()));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> toggleJobStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.toggleJobStatus(id, userDetails.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable Long id,
            @RequestParam(required = false) String txHash,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.deleteJob(id, userDetails.getId(), txHash));
    }

    @PostMapping("/{id}/repost")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> repostJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody RepostJobRequest req) {

        return ResponseEntity.ok(jobService.repostJob(id, userDetails.getId(), req));
    }

    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> applyJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody(required = false) ApplyJobRequest req) {

        ApiResponse<JobApplicationResponse> response = jobApplicationService.applyJob(id, userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobApplicationService.getMyApplications(userDetails.getId(), status, page, size));
    }

    @GetMapping("/{id}/my-application")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getMyApplicationForJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.getMyApplicationForJob(id, userDetails.getId()));
    }

    @DeleteMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<Void>> withdrawApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.withdrawApplication(applicationId, userDetails.getId()));
    }

    @GetMapping("/{id}/applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<List<JobApplicationResponse>>> getJobApplications(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.getJobApplications(id, userDetails.getId()));
    }

    @PutMapping("/applications/{applicationId}/accept")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> acceptApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        return ResponseEntity.ok(jobApplicationService.acceptApplication(applicationId, userDetails.getId(), txHash));
    }

    @PutMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> rejectApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.rejectApplication(applicationId, userDetails.getId()));
    }

    @PutMapping("/{id}/applications/batch-reject")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationService.BatchRejectResult>> batchRejectApplications(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody List<Long> applicationIds) {

        return ResponseEntity.ok(jobApplicationService.batchRejectApplications(id, applicationIds, userDetails.getId()));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<JobHistoryResponse>>> getJobHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        jobService.validateHistoryAccess(id, userDetails.getId());
        return ResponseEntity.ok(jobHistoryService.getJobHistory(id));
    }

    @GetMapping("/{id}/history/paged")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<JobHistoryResponse>>> getJobHistoryPaged(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        jobService.validateHistoryAccess(id, userDetails.getId());
        return ResponseEntity.ok(jobHistoryService.getJobHistoryPaged(id, page, size));
    }

    @PostMapping("/{id}/work/submit")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> submitWork(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody SubmitWorkRequest request) {

        return ResponseEntity.ok(jobWorkService.submitWork(
                id,
                userDetails.getId(),
                request.getUrl(),
                request.getNote(),
                request.getFileId(),
                request.getTxHash()));
    }

    @PutMapping("/{id}/work/approve")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> approveWork(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) String txHash) {

        return ResponseEntity.ok(jobWorkService.approveWork(id, userDetails.getId(), txHash));
    }

    @PutMapping("/{id}/work/revision")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> requestRevision(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) String txHash,
            @Valid @RequestBody RevisionRequest request) {

        return ResponseEntity.ok(jobWorkService.requestRevision(id, userDetails.getId(), request.getNote(), txHash));
    }

    @GetMapping("/{id}/work")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getWorkSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobWorkService.getWorkSubmission(id, userDetails.getId()));
    }

    @PostMapping("/{id}/complete-freelancer-timeout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<JobResponse>> completeFreelancerTimeout(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        return ResponseEntity.ok(jobService.completeFreelancerTimeout(id, userDetails.getId(), txHash));
    }

    @PostMapping("/{id}/complete-employer-timeout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<JobResponse>> completeEmployerTimeout(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        return ResponseEntity.ok(jobService.completeEmployerTimeout(id, userDetails.getId(), txHash));
    }

    @GetMapping("/pending-blockchain-actions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getPendingBlockchainActions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobService.getPendingBlockchainActions(page, size));
    }

    @PostMapping("/{id}/contract")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobContractResponse>> createContract(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateJobContractRequest request) {

        try {
            JobContractResponse contract = jobContractService.createContract(id, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Hợp đồng đã được tạo", contract));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/contract")
    public ResponseEntity<ApiResponse<JobContractResponse>> getContract(@PathVariable Long id) {
        try {
            JobContractResponse contract = jobContractService.getContractByJobId(id);
            return ResponseEntity.ok(ApiResponse.success(contract));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/contract/hash")
    public ResponseEntity<ApiResponse<String>> getContractHash(@PathVariable Long id) {
        try {
            String hash = jobContractService.getContractHash(id);
            return ResponseEntity.ok(ApiResponse.success(hash));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/contract/sign")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobContractResponse>> signContract(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        try {
            JobContractResponse contract = jobContractService.signContract(id, userDetails.getId(), txHash);
            return ResponseEntity.ok(ApiResponse.success("Đã ký hợp đồng thành công", contract));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // Freelancer từ chối hợp đồng
    @PostMapping("/{id}/contract/reject")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobResponse>> rejectContract(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        try {
            ApiResponse<JobResponse> response = jobService.rejectContract(id, userDetails.getId(), txHash);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // Employer hủy job trước khi freelancer ký
    @PostMapping("/{id}/contract/cancel-before-sign")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> cancelBeforeSign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        try {
            ApiResponse<JobResponse> response = jobService.cancelBeforeSign(id, userDetails.getId(), txHash);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // Xóa freelancer nếu quá 24h không ký
    @PostMapping("/{id}/contract/remove-unsigned")
    public ResponseEntity<ApiResponse<JobResponse>> removeUnsignedFreelancer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String txHash) {

        try {
            ApiResponse<JobResponse> response = jobService.removeUnsignedFreelancer(id, userDetails.getId(), txHash);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/escrow/{escrowId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelEscrow(
            @PathVariable Long escrowId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        try {
            if (!blockchainService.isInitialized()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiResponse.error("Blockchain service chưa sẵn sàng"));
            }
            String txHash = blockchainService.signCancelEscrow(escrowId);
            return ResponseEntity.ok(ApiResponse.success("Đã hoàn tiền escrow", txHash));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể hủy escrow: " + e.getMessage()));
        }
    }
}
