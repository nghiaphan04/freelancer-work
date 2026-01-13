package com.workhub.api.controller;

import com.workhub.api.dto.request.ApplyJobRequest;
import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobApplicationResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.EApplicationStatus;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.JobService;
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
    @GetMapping("/{id}")
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

    /**
     * Ứng tuyển vào job (chỉ FREELANCER)
     */
    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> applyJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody(required = false) ApplyJobRequest req) {

        ApiResponse<JobApplicationResponse> response = jobService.applyJob(id, userDetails.getId(), req);
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

        return ResponseEntity.ok(jobService.getMyApplications(userDetails.getId(), status, page, size));
    }

    /**
     * Kiểm tra đơn ứng tuyển của tôi cho 1 job (FREELANCER)
     */
    @GetMapping("/{id}/my-application")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getMyApplicationForJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.getMyApplicationForJob(id, userDetails.getId()));
    }

    /**
     * Rút đơn ứng tuyển (FREELANCER)
     */
    @DeleteMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<Void>> withdrawApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.withdrawApplication(applicationId, userDetails.getId()));
    }

    /**
     * Lấy danh sách đơn ứng tuyển của job (EMPLOYER)
     */
    @GetMapping("/{id}/applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<List<JobApplicationResponse>>> getJobApplications(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.getJobApplications(id, userDetails.getId()));
    }

    /**
     * Duyệt đơn ứng tuyển (EMPLOYER)
     */
    @PutMapping("/applications/{applicationId}/accept")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> acceptApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.acceptApplication(applicationId, userDetails.getId()));
    }

    /**
     * Từ chối đơn ứng tuyển (EMPLOYER)
     */
    @PutMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> rejectApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.rejectApplication(applicationId, userDetails.getId()));
    }
}
