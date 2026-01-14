package com.workhub.api.controller;

import com.workhub.api.dto.request.ApplyJobRequest;
import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.RejectJobRequest;
import com.workhub.api.dto.request.RevisionRequest;
import com.workhub.api.dto.request.SubmitWorkRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
import com.workhub.api.dto.response.JobHistoryResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.EApplicationStatus;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.JobAdminService;
import com.workhub.api.service.JobApplicationService;
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
    private final JobAdminService jobAdminService;
    private final JobApplicationService jobApplicationService;
    private final JobWorkService jobWorkService;
    private final JobHistoryService jobHistoryService;

    // ===== JOB CRUD (JobService) =====

    /**
     * Tạo job mới (chỉ EMPLOYER, trừ balance ngay)
     */
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> createJob(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateJobRequest req) {

        ApiResponse<JobResponse> response = jobService.createJob(userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách jobs đang tuyển (công khai)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getOpenJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(jobService.getOpenJobs(page, size, sortBy, sortDir));
    }

    /**
     * Lấy chi tiết job (công khai, tăng lượt xem)
     */
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<JobResponse>> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobByIdAndIncrementView(id));
    }

    /**
     * Lấy danh sách jobs của tôi
     */
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

    /**
     * Lấy danh sách jobs đang làm của freelancer
     */
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

    /**
     * Lấy thống kê jobs của freelancer
     */
    @GetMapping("/my-working-jobs/stats")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobService.FreelancerJobStats>> getMyWorkingJobsStats(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(jobService.getFreelancerJobStats(userDetails.getId()));
    }

    /**
     * Tìm kiếm jobs theo từ khóa
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> searchJobs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobService.searchJobs(keyword, page, size));
    }

    /**
     * Tìm jobs theo kỹ năng
     */
    @GetMapping("/by-skills")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getJobsBySkills(
            @RequestParam List<String> skills,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobService.getJobsBySkills(skills, page, size));
    }

    /**
     * Cập nhật job (chỉ EMPLOYER)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateJobRequest req) {

        return ResponseEntity.ok(jobService.updateJob(id, userDetails.getId(), req));
    }

    /**
     * Đóng tin tuyển dụng (chỉ EMPLOYER)
     */
    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> closeJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.closeJob(id, userDetails.getId()));
    }

    /**
     * Chuyển đổi trạng thái job (DRAFT <-> OPEN)
     */
    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> toggleJobStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.toggleJobStatus(id, userDetails.getId()));
    }

    /**
     * Xóa job (EMPLOYER hoặc ADMIN)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.deleteJob(id, userDetails.getId()));
    }

    // ===== JOB APPLICATION (JobApplicationService) =====

    /**
     * Ứng tuyển vào job (chỉ FREELANCER)
     */
    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> applyJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody(required = false) ApplyJobRequest req) {

        ApiResponse<JobApplicationResponse> response = jobApplicationService.applyJob(id, userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách đơn ứng tuyển của tôi (FREELANCER)
     */
    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobApplicationService.getMyApplications(userDetails.getId(), status, page, size));
    }

    /**
     * Kiểm tra đơn ứng tuyển của tôi cho 1 job (FREELANCER)
     */
    @GetMapping("/{id}/my-application")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getMyApplicationForJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.getMyApplicationForJob(id, userDetails.getId()));
    }

    /**
     * Rút đơn ứng tuyển (FREELANCER)
     */
    @DeleteMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<Void>> withdrawApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.withdrawApplication(applicationId, userDetails.getId()));
    }

    /**
     * Lấy danh sách đơn ứng tuyển của job (EMPLOYER)
     */
    @GetMapping("/{id}/applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<List<JobApplicationResponse>>> getJobApplications(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.getJobApplications(id, userDetails.getId()));
    }

    /**
     * Duyệt đơn ứng tuyển (EMPLOYER)
     */
    @PutMapping("/applications/{applicationId}/accept")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> acceptApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.acceptApplication(applicationId, userDetails.getId()));
    }

    /**
     * Từ chối đơn ứng tuyển (EMPLOYER)
     */
    @PutMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> rejectApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobApplicationService.rejectApplication(applicationId, userDetails.getId()));
    }

    // ===== ADMIN APPROVAL (JobAdminService) =====

    /**
     * [ADMIN] Lấy danh sách jobs chờ duyệt
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getPendingJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobAdminService.getPendingJobs(page, size));
    }

    /**
     * [ADMIN] Lấy jobs theo status
     */
    @GetMapping("/admin/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<JobResponse>>> getJobsByStatus(
            @PathVariable EJobStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(jobAdminService.getJobsByStatus(status, page, size));
    }

    /**
     * [ADMIN] Duyệt job
     */
    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<JobResponse>> approveJob(@PathVariable Long id) {

        return ResponseEntity.ok(jobAdminService.approveJob(id));
    }

    /**
     * [ADMIN] Từ chối job
     */
    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<JobResponse>> rejectJob(
            @PathVariable Long id,
            @Valid @RequestBody RejectJobRequest request) {

        return ResponseEntity.ok(jobAdminService.rejectJob(id, request.getReason()));
    }

    /**
     * [ADMIN] Đếm số jobs chờ duyệt
     */
    @GetMapping("/admin/count/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> countPendingJobs() {

        return ResponseEntity.ok(jobAdminService.countPendingJobs());
    }

    // ===== JOB HISTORY (JobHistoryService) =====

    /**
     * Lấy lịch sử hoạt động của job
     * - Employer xem được lịch sử job của mình
     * - Freelancer đã được accept xem được lịch sử
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<JobHistoryResponse>>> getJobHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        // Kiểm tra quyền xem: employer của job hoặc freelancer đã được accept
        jobService.validateHistoryAccess(id, userDetails.getId());
        return ResponseEntity.ok(jobHistoryService.getJobHistory(id));
    }

    /**
     * Lấy lịch sử hoạt động của job (phân trang)
     */
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

    // ===== WORK SUBMISSION (JobWorkService) =====

    /**
     * Freelancer nộp sản phẩm
     * POST /api/jobs/{id}/work/submit
     */
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
                request.getFileId()));
    }

    /**
     * Employer duyệt sản phẩm → Thanh toán + Cộng điểm uy tín
     * PUT /api/jobs/{id}/work/approve
     */
    @PutMapping("/{id}/work/approve")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> approveWork(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobWorkService.approveWork(id, userDetails.getId()));
    }

    /**
     * Employer yêu cầu chỉnh sửa
     * PUT /api/jobs/{id}/work/revision
     */
    @PutMapping("/{id}/work/revision")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> requestRevision(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody RevisionRequest request) {

        return ResponseEntity.ok(jobWorkService.requestRevision(id, userDetails.getId(), request.getNote()));
    }

    /**
     * Lấy thông tin work submission của job
     * GET /api/jobs/{id}/work
     */
    @GetMapping("/{id}/work")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getWorkSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobWorkService.getWorkSubmission(id, userDetails.getId()));
    }
}
