package com.workhub.api.controller;

import com.workhub.api.dto.request.CreateJobRequest;
import com.workhub.api.dto.request.UpdateJobRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    /**
     * Tạo job mới (lưu nháp hoặc đăng luôn)
     */
    @PostMapping
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
     * Cập nhật job
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateJobRequest req) {

        return ResponseEntity.ok(jobService.updateJob(id, userDetails.getId(), req));
    }

    /**
     * Đăng tin (chuyển từ DRAFT sang OPEN)
     */
    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<JobResponse>> publishJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.publishJob(id, userDetails.getId()));
    }

    /**
     * Đóng tin tuyển dụng
     */
    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<JobResponse>> closeJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.closeJob(id, userDetails.getId()));
    }

    /**
     * Xóa job
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(jobService.deleteJob(id, userDetails.getId()));
    }
}
