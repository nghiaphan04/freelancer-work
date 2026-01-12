package com.workhub.api.controller;

import com.workhub.api.dto.request.ZaloPayCallbackRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.PaymentResponse;
import com.workhub.api.entity.EPaymentStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(paymentService.createPaymentForJob(jobId, userDetails.getId()));
    }

    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(
            @RequestBody ZaloPayCallbackRequest request) {

        log.info("Received ZaloPay callback: type={}", request.getType());
        Map<String, Object> result = paymentService.handleCallback(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/query/{appTransId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> queryPaymentStatus(
            @PathVariable String appTransId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(paymentService.queryPaymentStatus(appTransId, userDetails.getId()));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByJobId(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(paymentService.getPaymentByJobId(jobId, userDetails.getId()));
    }

    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EPaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(paymentService.getMyPayments(userDetails.getId(), status, page, size));
    }
}
