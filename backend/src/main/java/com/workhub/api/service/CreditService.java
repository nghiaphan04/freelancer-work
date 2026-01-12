package com.workhub.api.service;

import com.workhub.api.dto.request.PurchaseCreditRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.CreditPackageResponse;
import com.workhub.api.dto.response.CreditPurchaseResponse;
import com.workhub.api.entity.*;
import com.workhub.api.repository.CreditPurchaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditService {

    private final CreditPurchaseRepository creditPurchaseRepository;
    private final UserService userService;
    private static final BigDecimal PRICE_PER_CREDIT = new BigDecimal("10000");

    public ApiResponse<List<CreditPackageResponse>> getCreditPackages() {
        List<CreditPackageResponse> packages = new ArrayList<>();

        for (ECreditPackage pkg : ECreditPackage.values()) {
            BigDecimal originalPrice = PRICE_PER_CREDIT.multiply(BigDecimal.valueOf(pkg.getCredits()));
            BigDecimal actualPrice = pkg.getPrice();
            int discountPercent = originalPrice.compareTo(actualPrice) > 0
                    ? originalPrice.subtract(actualPrice)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(originalPrice, 0, RoundingMode.HALF_UP)
                        .intValue()
                    : 0;

            packages.add(CreditPackageResponse.builder()
                    .packageId(pkg.name())
                    .credits(pkg.getCredits())
                    .price(actualPrice)
                    .pricePerCredit(pkg.getPricePerCredit())
                    .originalPrice(originalPrice)
                    .discountPercent(discountPercent)
                    .description(pkg.getDescription())
                    .build());
        }

        return ApiResponse.success("Thành công", packages);
    }

    @Transactional
    public ApiResponse<CreditPurchaseResponse> purchaseCredits(Long userId, PurchaseCreditRequest req) {
        User user = userService.getById(userId);
        ECreditPackage creditPackage = req.getCreditPackage();

        BigDecimal price = creditPackage.getPrice();

        if (!user.hasEnoughBalance(price)) {
            throw new IllegalStateException("Không đủ số dư. Vui lòng nạp thêm số dư để mua credit.");
        }

        user.deductBalance(price);
        user.addCredits(creditPackage.getCredits());
        userService.save(user);

        String appTransId = generateAppTransId(userId);
        String description = "WorkHub - Mua " + creditPackage.getCredits() + " credit bằng số dư";

        CreditPurchase purchase = CreditPurchase.builder()
                .appTransId(appTransId)
                .user(user)
                .creditPackage(creditPackage)
                .creditsAmount(creditPackage.getCredits())
                .totalAmount(price)
                .currency("VND")
                .description(description)
                .status(EPaymentStatus.PAID)
                .paidAt(LocalDateTime.now())
                .creditsGranted(true)
                .build();

        CreditPurchase saved = creditPurchaseRepository.save(purchase);
        return ApiResponse.success("Mua credit thành công từ số dư (còn " + user.getBalance() + " VND)", buildPurchaseResponse(saved));
    }

    public ApiResponse<CreditPurchaseResponse> queryPurchaseStatus(String appTransId, Long userId) {
        CreditPurchase purchase = creditPurchaseRepository.findByAppTransId(appTransId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn mua credit"));

        if (!purchase.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem đơn này");
        }

        return ApiResponse.success("Thành công", buildPurchaseResponse(purchase));
    }

    public ApiResponse<Page<CreditPurchaseResponse>> getMyPurchases(Long userId, EPaymentStatus status,
                                                                     int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<CreditPurchase> purchases;
        if (status != null) {
            purchases = creditPurchaseRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            purchases = creditPurchaseRepository.findByUserId(userId, pageable);
        }

        Page<CreditPurchaseResponse> response = purchases.map(this::buildPurchaseResponse);
        return ApiResponse.success("Thành công", response);
    }

    public ApiResponse<Page<CreditPurchaseResponse>> getAllPurchases(EPaymentStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<CreditPurchase> purchases;
        if (status != null) {
            purchases = creditPurchaseRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            purchases = creditPurchaseRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        Page<CreditPurchaseResponse> response = purchases.map(this::buildPurchaseResponse);
        return ApiResponse.success("Thành công", response);
    }

    private String generateAppTransId(Long userId) {
        String datePrefix = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"));
        int random = new Random().nextInt(900000) + 100000;
        return datePrefix + "_CR_BAL_" + userId + "_" + random;
    }

    private CreditPurchaseResponse buildPurchaseResponse(CreditPurchase purchase) {
        return CreditPurchaseResponse.builder()
                .id(purchase.getId())
                .appTransId(purchase.getAppTransId())
                .zpTransId(purchase.getZpTransId())
                .userId(purchase.getUser().getId())
                .userFullName(purchase.getUser().getFullName())
                .creditPackage(purchase.getCreditPackage())
                .creditsAmount(purchase.getCreditsAmount())
                .totalAmount(purchase.getTotalAmount())
                .currency(purchase.getCurrency())
                .description(purchase.getDescription())
                .orderUrl(purchase.getOrderUrl())
                .qrCode(purchase.getQrCode())
                .status(purchase.getStatus())
                .paymentChannel(purchase.getPaymentChannel())
                .creditsGranted(purchase.getCreditsGranted())
                .expiredAt(purchase.getExpiredAt())
                .paidAt(purchase.getPaidAt())
                .createdAt(purchase.getCreatedAt())
                .build();
    }
}
