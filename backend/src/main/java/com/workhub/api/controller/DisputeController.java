package com.workhub.api.controller;

import com.workhub.api.dto.request.CreateDisputeRequest;
import com.workhub.api.dto.request.DisputeResponseRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.DisputeResponse;
import com.workhub.api.dto.response.DisputeRoundResponse;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping("/jobs/{jobId}/disputes")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<DisputeResponse>> createDispute(
            @PathVariable Long jobId,
            @RequestParam(required = false) String txHash,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateDisputeRequest request) {

        ApiResponse<DisputeResponse> response = disputeService.createDispute(
                jobId, userDetails.getId(), request, txHash);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/jobs/{jobId}/disputes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDisputeByJobId(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(disputeService.getDisputeByJobId(jobId, userDetails.getId()));
    }

    @PutMapping("/disputes/{disputeId}/respond")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse<DisputeResponse>> submitFreelancerResponse(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody DisputeResponseRequest request) {

        return ResponseEntity.ok(disputeService.submitFreelancerResponse(
                disputeId, userDetails.getId(), request));
    }

    @GetMapping("/disputes/{disputeId}/rounds")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DisputeRoundResponse>>> getDisputeRounds(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(disputeService.getDisputeRounds(disputeId, userDetails.getId()));
    }
}
