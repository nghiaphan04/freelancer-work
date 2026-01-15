package com.workhub.api.controller;

import com.workhub.api.dto.request.PurchaseCreditRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.CreditPackageResponse;
import com.workhub.api.dto.response.CreditPurchaseResponse;
import com.workhub.api.entity.EPaymentStatus;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.CreditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditService creditService;

    /**
     * Lấy danh sách gói credit
     */
    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<List<CreditPackageResponse>>> getCreditPackages() {
        return ResponseEntity.ok(creditService.getCreditPackages());
    }

    /**
     * Mua credit
     */
    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<CreditPurchaseResponse>> purchaseCredits(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody PurchaseCreditRequest req) {

        ApiResponse<CreditPurchaseResponse> response = creditService.purchaseCredits(userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Kiểm tra trạng thái đơn mua credit
     */
    @GetMapping("/purchase/{appTransId}/status")
    public ResponseEntity<ApiResponse<CreditPurchaseResponse>> queryPurchaseStatus(
            @PathVariable String appTransId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(creditService.queryPurchaseStatus(appTransId, userDetails.getId()));
    }

    /**
     * Lấy lịch sử mua credit của tôi
     */
    @GetMapping("/my-purchases")
    public ResponseEntity<ApiResponse<Page<CreditPurchaseResponse>>> getMyPurchases(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) EPaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(creditService.getMyPurchases(userDetails.getId(), status, page, size));
    }

    /**
     * [ADMIN] Lấy tất cả đơn mua credit
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<CreditPurchaseResponse>>> getAllPurchases(
            @RequestParam(required = false) EPaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(creditService.getAllPurchases(status, page, size));
    }
}
