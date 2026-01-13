package com.workhub.api.controller;

import com.workhub.api.dto.request.CreateWithdrawalRequest;
import com.workhub.api.dto.request.RespondWithdrawalRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.WithdrawalRequestResponse;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.WithdrawalRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs/{jobId}/withdrawal")
@RequiredArgsConstructor
public class WithdrawalRequestController {

    private final WithdrawalRequestService withdrawalRequestService;

    /**
     * Freelancer tạo yêu cầu rút khỏi job
     * POST /api/jobs/{jobId}/withdrawal/freelancer
     */
    @PostMapping("/freelancer")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<WithdrawalRequestResponse>> createFreelancerWithdrawal(
            @PathVariable Long jobId,
            @Valid @RequestBody CreateWithdrawalRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.createFreelancerWithdrawal(
                jobId, userDetails.getId(), request));
    }

    /**
     * Employer tạo yêu cầu hủy job
     * POST /api/jobs/{jobId}/withdrawal/employer
     */
    @PostMapping("/employer")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<WithdrawalRequestResponse>> createEmployerCancellation(
            @PathVariable Long jobId,
            @Valid @RequestBody CreateWithdrawalRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.createEmployerCancellation(
                jobId, userDetails.getId(), request));
    }

    /**
     * Chấp nhận yêu cầu
     * PUT /api/jobs/{jobId}/withdrawal/{requestId}/approve
     */
    @PutMapping("/{requestId}/approve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WithdrawalRequestResponse>> approveRequest(
            @PathVariable Long jobId,
            @PathVariable Long requestId,
            @RequestBody(required = false) RespondWithdrawalRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.approveRequest(
                requestId, userDetails.getId(), request));
    }

    /**
     * Từ chối yêu cầu
     * PUT /api/jobs/{jobId}/withdrawal/{requestId}/reject
     */
    @PutMapping("/{requestId}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WithdrawalRequestResponse>> rejectRequest(
            @PathVariable Long jobId,
            @PathVariable Long requestId,
            @RequestBody(required = false) RespondWithdrawalRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.rejectRequest(
                requestId, userDetails.getId(), request));
    }

    /**
     * Người tạo hủy yêu cầu của mình
     * DELETE /api/jobs/{jobId}/withdrawal/{requestId}
     */
    @DeleteMapping("/{requestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @PathVariable Long jobId,
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.cancelRequest(
                requestId, userDetails.getId()));
    }

    /**
     * Lấy yêu cầu pending của job
     * GET /api/jobs/{jobId}/withdrawal/pending
     */
    @GetMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WithdrawalRequestResponse>> getPendingRequest(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.getPendingRequest(
                jobId, userDetails.getId()));
    }

    /**
     * Lấy lịch sử yêu cầu của job
     * GET /api/jobs/{jobId}/withdrawal/history
     */
    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<WithdrawalRequestResponse>>> getJobRequests(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(withdrawalRequestService.getJobRequests(
                jobId, userDetails.getId()));
    }
}
