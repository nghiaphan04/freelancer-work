package com.workhub.api.controller;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.BalanceDepositResponse;
import com.workhub.api.dto.response.BalanceStatisticsResponse;
import com.workhub.api.entity.EDepositStatus;
import com.workhub.api.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/balance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBalanceController {

    private final BalanceService balanceService;

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<BalanceStatisticsResponse>> getStatistics() {
        return ResponseEntity.ok(balanceService.getDepositStatistics());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BalanceDepositResponse>>> getAllDeposits(
            @RequestParam(required = false) EDepositStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(balanceService.getAllDeposits(status, page, size));
    }
}
