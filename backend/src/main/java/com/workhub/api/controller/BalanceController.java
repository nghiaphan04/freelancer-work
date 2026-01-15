package com.workhub.api.controller;

import com.workhub.api.dto.request.DepositBalanceRequest;
import com.workhub.api.dto.request.ZaloPayCallbackRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.BalanceDepositResponse;
import com.workhub.api.entity.EDepositStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.BalanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/balance")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<BalanceDepositResponse>> createDeposit(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody DepositBalanceRequest req) {

        ApiResponse<BalanceDepositResponse> response = balanceService.createDeposit(userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(@RequestBody ZaloPayCallbackRequest request) {
        Map<String, Object> result = balanceService.handleCallback(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/deposit/{appTransId}/status")
    public ResponseEntity<ApiResponse<BalanceDepositResponse>> queryDepositStatus(
            @PathVariable String appTransId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(balanceService.queryDepositStatus(appTransId, userDetails.getId()));
    }

    @GetMapping("/my-deposits")
    public ResponseEntity<ApiResponse<Page<BalanceDepositResponse>>> getMyDeposits(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EDepositStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(balanceService.getMyDeposits(userDetails.getId(), status, page, size));
    }
}
