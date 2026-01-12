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

/**
 * Controller xử lý các API thanh toán qua ZaloPay
 */
@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Tạo đơn hàng thanh toán cho job
     * POST /api/payments/jobs/{jobId}
     */
    @PostMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(paymentService.createPaymentForJob(jobId, userDetails.getId()));
    }

    /**
     * Callback nhận thông báo thanh toán từ ZaloPay
     * POST /api/payments/callback
     * 
     * ZaloPay sẽ gọi API này khi user thanh toán thành công
     * Response format: {"return_code": 1, "return_message": "success"}
     */
    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(
            @RequestBody ZaloPayCallbackRequest request) {

        log.info("Received ZaloPay callback: type={}", request.getType());
        Map<String, Object> result = paymentService.handleCallback(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Truy vấn trạng thái thanh toán
     * GET /api/payments/query/{appTransId}
     * 
     * Dùng để kiểm tra trạng thái đơn hàng nếu không nhận được callback
     */
    @GetMapping("/query/{appTransId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> queryPaymentStatus(
            @PathVariable String appTransId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(paymentService.queryPaymentStatus(appTransId, userDetails.getId()));
    }

    /**
     * Lấy thông tin thanh toán theo jobId
     * GET /api/payments/jobs/{jobId}
     */
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByJobId(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(paymentService.getPaymentByJobId(jobId, userDetails.getId()));
    }

    /**
     * Lấy danh sách thanh toán của tôi
     * GET /api/payments/my-payments
     */
    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EPaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(paymentService.getMyPayments(userDetails.getId(), status, page, size));
    }
}
