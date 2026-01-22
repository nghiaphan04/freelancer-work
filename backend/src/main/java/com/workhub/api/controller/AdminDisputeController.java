package com.workhub.api.controller;

import com.workhub.api.dto.request.AdminVoteRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.DisputeResponse;
import com.workhub.api.dto.response.DisputeRoundResponse;
import com.workhub.api.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin/disputes")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDisputeController {

    private final DisputeService disputeService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<DisputeResponse>>> getPendingDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(disputeService.getPendingDisputes(page, size));
    }

    @GetMapping("/pending/count")
    public ResponseEntity<ApiResponse<Long>> countPendingDisputes() {
        return ResponseEntity.ok(disputeService.countPendingDisputes());
    }

    @GetMapping("/my-pending-votes")
    public ResponseEntity<ApiResponse<List<DisputeRoundResponse>>> getMyPendingVotes(
            @AuthenticationPrincipal(expression = "id") Long adminId
    ) {
        return ResponseEntity.ok(disputeService.getMyPendingVotes(adminId));
    }

    @PostMapping("/{disputeId}/vote")
    public ResponseEntity<ApiResponse<DisputeRoundResponse>> submitVote(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal(expression = "id") Long adminId,
            @RequestBody AdminVoteRequest request
    ) {
        return ResponseEntity.ok(disputeService.submitAdminVote(disputeId, adminId, request));
    }

    @GetMapping("/{disputeId}/rounds")
    public ResponseEntity<ApiResponse<List<DisputeRoundResponse>>> getDisputeRounds(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal(expression = "id") Long adminId
    ) {
        return ResponseEntity.ok(disputeService.getDisputeRounds(disputeId, adminId));
    }
}
