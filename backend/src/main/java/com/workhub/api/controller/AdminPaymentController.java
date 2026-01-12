package com.workhub.api.controller;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.PaymentResponse;
import com.workhub.api.dto.response.PaymentStatisticsResponse;
import com.workhub.api.entity.EPaymentStatus;
import com.workhub.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<PaymentStatisticsResponse>> getPaymentStatistics() {
        return ResponseEntity.ok(paymentService.getPaymentStatistics());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getAllPayments(
            @RequestParam(required = false) EPaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(paymentService.getAllPayments(status, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> searchPayments(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(paymentService.searchPayments(keyword, page, size));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getRecentPayments() {
        return ResponseEntity.ok(paymentService.getRecentPaidPayments());
    }
}
