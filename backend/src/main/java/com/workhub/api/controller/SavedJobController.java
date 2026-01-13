package com.workhub.api.controller;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.SavedJobResponse;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.SavedJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-jobs")
@RequiredArgsConstructor
public class SavedJobController {

    private final SavedJobService savedJobService;

    /**
     * Lưu công việc
     */
    @PostMapping("/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SavedJobResponse>> saveJob(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long jobId) {
        return ResponseEntity.ok(savedJobService.saveJob(userDetails.getId(), jobId));
    }

    /**
     * Bỏ lưu công việc
     */
    @DeleteMapping("/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> unsaveJob(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long jobId) {
        return ResponseEntity.ok(savedJobService.unsaveJob(userDetails.getId(), jobId));
    }

    /**
     * Toggle lưu/bỏ lưu công việc
     */
    @PostMapping("/{jobId}/toggle")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SavedJobResponse>> toggleSaveJob(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long jobId) {
        return ResponseEntity.ok(savedJobService.toggleSaveJob(userDetails.getId(), jobId));
    }

    /**
     * Lấy danh sách công việc đã lưu
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<SavedJobResponse>>> getSavedJobs(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(savedJobService.getSavedJobs(userDetails.getId(), page, size));
    }

    /**
     * Lấy danh sách ID các công việc đã lưu
     */
    @GetMapping("/ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Long>>> getSavedJobIds(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(savedJobService.getSavedJobIds(userDetails.getId()));
    }

    /**
     * Kiểm tra công việc đã được lưu chưa
     */
    @GetMapping("/{jobId}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isJobSaved(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long jobId) {
        return ResponseEntity.ok(savedJobService.isJobSaved(userDetails.getId(), jobId));
    }
}
