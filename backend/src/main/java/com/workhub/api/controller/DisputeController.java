package com.workhub.api.controller;

import com.workhub.api.dto.request.CreateDisputeRequest;
import com.workhub.api.dto.request.DisputeResponseRequest;
import com.workhub.api.dto.request.RequestDisputeResponseRequest;
import com.workhub.api.dto.request.ResolveDisputeRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.DisputeResponse;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    // ===== EMPLOYER ENDPOINTS =====

    /**
     * Employer tạo khiếu nại
     * POST /api/jobs/{jobId}/disputes
     */
    @PostMapping("/jobs/{jobId}/disputes")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<DisputeResponse>> createDispute(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateDisputeRequest request) {

        ApiResponse<DisputeResponse> response = disputeService.createDispute(
                jobId, userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy thông tin khiếu nại của job
     * GET /api/jobs/{jobId}/disputes
     */
    @GetMapping("/jobs/{jobId}/disputes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDisputeByJobId(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(disputeService.getDisputeByJobId(jobId, userDetails.getId()));
    }

    // ===== FREELANCER ENDPOINTS =====

    /**
     * Freelancer gửi phản hồi khiếu nại
     * PUT /api/disputes/{disputeId}/respond
     */
    @PutMapping("/disputes/{disputeId}/respond")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<DisputeResponse>> submitFreelancerResponse(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody DisputeResponseRequest request) {

        return ResponseEntity.ok(disputeService.submitFreelancerResponse(
                disputeId, userDetails.getId(), request));
    }

    // ===== ADMIN ENDPOINTS =====

    /**
     * [ADMIN] Lấy danh sách khiếu nại đang chờ xử lý
     * GET /api/admin/disputes
     */
    @GetMapping("/admin/disputes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<DisputeResponse>>> getPendingDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(disputeService.getPendingDisputes(page, size));
    }

    /**
     * [ADMIN] Đếm số khiếu nại đang chờ
     * GET /api/admin/disputes/count
     */
    @GetMapping("/admin/disputes/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> countPendingDisputes() {

        return ResponseEntity.ok(disputeService.countPendingDisputes());
    }

    /**
     * [ADMIN] Yêu cầu freelancer phản hồi
     * PUT /api/admin/disputes/{disputeId}/request-response
     */
    @PutMapping("/admin/disputes/{disputeId}/request-response")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeResponse>> requestFreelancerResponse(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody(required = false) RequestDisputeResponseRequest request) {

        int daysToRespond = (request != null) ? request.getDaysToRespond() : 3;
        return ResponseEntity.ok(disputeService.requestFreelancerResponse(
                disputeId, userDetails.getId(), daysToRespond));
    }

    /**
     * [ADMIN] Quyết định tranh chấp
     * PUT /api/admin/disputes/{disputeId}/resolve
     */
    @PutMapping("/admin/disputes/{disputeId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeResponse>> resolveDispute(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ResolveDisputeRequest request) {

        return ResponseEntity.ok(disputeService.resolveDispute(
                disputeId, userDetails.getId(), request));
    }
}
