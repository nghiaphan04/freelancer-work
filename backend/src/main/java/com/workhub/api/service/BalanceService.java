package com.workhub.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workhub.api.config.ZaloPayConfig;
import com.workhub.api.dto.request.DepositBalanceRequest;
import com.workhub.api.dto.request.ZaloPayCallbackRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.BalanceDepositResponse;
import com.workhub.api.dto.response.BalanceStatisticsResponse;
import com.workhub.api.entity.BalanceDeposit;
import com.workhub.api.entity.EDepositStatus;
import com.workhub.api.entity.User;
import com.workhub.api.repository.BalanceDepositRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class BalanceService {

    private final BalanceDepositRepository balanceDepositRepository;
    private final UserService userService;
    private final ZaloPayConfig zaloPayConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.payment.test-mode:false}")
    private boolean testMode;

    private static final int PAYMENT_EXPIRY_SECONDS = 900;

    @Transactional
    public ApiResponse<BalanceDepositResponse> createDeposit(Long userId, DepositBalanceRequest req) {
        if (req == null || req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }

        User user = userService.getById(userId);
        BigDecimal amount = req.getAmount();

        String appTransId = generateAppTransId(userId);
        long appTime = System.currentTimeMillis();
        String description = "WorkHub - Nap so du " + amount.toPlainString() + " VND";

        String redirectUrl = zaloPayConfig.getReturnUrl() + "?type=balance&userId=" + userId;
        String embedData = String.format("{\"redirecturl\":\"%s\",\"type\":\"balance\",\"userId\":%d}", redirectUrl, userId);
        String item = "[]";

        BalanceDeposit deposit = BalanceDeposit.builder()
                .appTransId(appTransId)
                .user(user)
                .amount(amount)
                .description(description)
                .status(EDepositStatus.PENDING)
                .expiredAt(LocalDateTime.now().plusSeconds(PAYMENT_EXPIRY_SECONDS))
                .build();

        try {
            JsonNode zaloPayResponse = callZaloPayCreateOrder(
                    appTransId,
                    user.getFullName(),
                    appTime,
                    amount.longValue(),
                    description,
                    embedData,
                    item
            );

            int returnCode = zaloPayResponse.get("return_code").asInt();
            if (returnCode == 1) {
                String orderUrl = zaloPayResponse.has("order_url") ?
                        zaloPayResponse.get("order_url").asText() : null;
                String qrCode = zaloPayResponse.has("qr_code") ?
                        zaloPayResponse.get("qr_code").asText() : null;
                String zpTransToken = zaloPayResponse.has("zp_trans_token") ?
                        zaloPayResponse.get("zp_trans_token").asText() : null;

                deposit.setZaloPayInfo(orderUrl, qrCode, zpTransToken);
            } else {
                String returnMessage = zaloPayResponse.get("return_message").asText();
                String subReturnMessage = zaloPayResponse.has("sub_return_message") ?
                        zaloPayResponse.get("sub_return_message").asText() : "";
                throw new RuntimeException("ZaloPay error: " + returnMessage + " - " + subReturnMessage);
            }

        } catch (Exception e) {
            log.error("Lỗi gọi ZaloPay API", e);
            throw new RuntimeException("Lỗi tạo đơn nạp số dư: " + e.getMessage());
        }

        BalanceDeposit saved = balanceDepositRepository.save(deposit);
        return ApiResponse.success("Tạo đơn nạp số dư thành công", buildDepositResponse(saved));
    }

    @Transactional
    public Map<String, Object> handleCallback(ZaloPayCallbackRequest request) {
        Map<String, Object> result = new HashMap<>();

        try {
            String dataStr = request.getData();
            String requestMac = request.getMac();

            if (!testMode && !zaloPayConfig.verifyCallback(dataStr, requestMac)) {
                log.warn("Callback không hợp lệ - MAC không khớp");
                result.put("return_code", -1);
                result.put("return_message", "mac not equal");
                return result;
            }

            ZaloPayCallbackRequest.CallbackData callbackData =
                    objectMapper.readValue(dataStr, ZaloPayCallbackRequest.CallbackData.class);

            String appTransId = callbackData.getAppTransId();
            log.info("Nhận callback nạp balance từ ZaloPay: appTransId={}, zpTransId={}",
                    appTransId, callbackData.getZpTransId());

            BalanceDeposit deposit = balanceDepositRepository.findByAppTransId(appTransId).orElse(null);

            if (deposit == null) {
                log.warn("Không tìm thấy balance deposit với appTransId: {}", appTransId);
                result.put("return_code", 1);
                result.put("return_message", "success");
                return result;
            }

            if (deposit.isPaid()) {
                log.info("Balance deposit đã được xử lý trước đó: {}", appTransId);
                result.put("return_code", 2);
                result.put("return_message", "duplicate");
                return result;
            }

            deposit.markAsPaid(callbackData.getZpTransId(), callbackData.getChannel());

            if (deposit.isPaid()) {
                User user = deposit.getUser();
                user.addBalance(deposit.getAmount());
                userService.save(user);
                log.info("Đã cộng {} vào số dư user {}", deposit.getAmount(), user.getId());
            }

            balanceDepositRepository.save(deposit);

            result.put("return_code", 1);
            result.put("return_message", "success");

        } catch (Exception e) {
            log.error("Lỗi xử lý callback balance", e);
            result.put("return_code", 0);
            result.put("return_message", e.getMessage());
        }

        return result;
    }

    @Transactional
    public ApiResponse<BalanceDepositResponse> queryDepositStatus(String appTransId, Long userId) {
        BalanceDeposit deposit = balanceDepositRepository.findByAppTransId(appTransId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn nạp số dư"));

        if (!deposit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem đơn này");
        }

        if (deposit.isPending()) {
            try {
                JsonNode queryResult = callZaloPayQuery(appTransId);
                int returnCode = queryResult.get("return_code").asInt();

                if (returnCode == 1) {
                    Long zpTransId = queryResult.has("zp_trans_id") ?
                            queryResult.get("zp_trans_id").asLong() : null;
                    deposit.markAsPaid(zpTransId, null);

                    if (deposit.isPaid()) {
                        User user = deposit.getUser();
                        user.addBalance(deposit.getAmount());
                        userService.save(user);
                        log.info("Đã cộng {} vào số dư user {} (từ query)", deposit.getAmount(), user.getId());
                    }

                    deposit = balanceDepositRepository.save(deposit);
                    log.info("Cập nhật trạng thái từ query: appTransId={}, status=PAID", appTransId);
                } else if (returnCode == 2) {
                    deposit.markAsCancelled();
                    deposit = balanceDepositRepository.save(deposit);
                }

            } catch (Exception e) {
                log.error("Lỗi query ZaloPay", e);
            }
        }

        return ApiResponse.success("Thành công", buildDepositResponse(deposit));
    }

    public ApiResponse<Page<BalanceDepositResponse>> getMyDeposits(Long userId, EDepositStatus status,
                                                                    int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<BalanceDeposit> deposits;
        if (status != null) {
            deposits = balanceDepositRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            deposits = balanceDepositRepository.findByUserId(userId, pageable);
        }

        Page<BalanceDepositResponse> response = deposits.map(this::buildDepositResponse);
        return ApiResponse.success("Thành công", response);
    }

    public ApiResponse<Page<BalanceDepositResponse>> getAllDeposits(EDepositStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<BalanceDeposit> deposits;
        if (status != null) {
            deposits = balanceDepositRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            deposits = balanceDepositRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        Page<BalanceDepositResponse> response = deposits.map(this::buildDepositResponse);
        return ApiResponse.success("Thành công", response);
    }

    public ApiResponse<BalanceStatisticsResponse> getDepositStatistics() {
        BigDecimal totalDeposited = balanceDepositRepository.sumAmountByStatus(EDepositStatus.PAID);

        Long totalTransactions = balanceDepositRepository.count();
        Long paidTransactions = balanceDepositRepository.countByStatus(EDepositStatus.PAID);
        Long pendingTransactions = balanceDepositRepository.countByStatus(EDepositStatus.PENDING);
        Long cancelledTransactions = balanceDepositRepository.countByStatus(EDepositStatus.CANCELLED);
        Long expiredTransactions = balanceDepositRepository.countByStatus(EDepositStatus.EXPIRED);

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        BigDecimal todayDeposited = balanceDepositRepository.sumAmountByStatusAndPaidAtAfter(
                EDepositStatus.PAID, startOfToday);
        Long todayTransactions = balanceDepositRepository.countByStatusAndPaidAtAfter(
                EDepositStatus.PAID, startOfToday);

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal monthDeposited = balanceDepositRepository.sumAmountByStatusAndPaidAtAfter(
                EDepositStatus.PAID, startOfMonth);
        Long monthTransactions = balanceDepositRepository.countByStatusAndPaidAtAfter(
                EDepositStatus.PAID, startOfMonth);

        BalanceStatisticsResponse statistics = BalanceStatisticsResponse.builder()
                .totalDeposited(totalDeposited)
                .totalTransactions(totalTransactions)
                .paidTransactions(paidTransactions)
                .pendingTransactions(pendingTransactions)
                .cancelledTransactions(cancelledTransactions)
                .expiredTransactions(expiredTransactions)
                .todayDeposited(todayDeposited)
                .todayTransactions(todayTransactions)
                .monthDeposited(monthDeposited)
                .monthTransactions(monthTransactions)
                .build();

        return ApiResponse.success("Lấy thống kê nạp số dư thành công", statistics);
    }

    private JsonNode callZaloPayCreateOrder(String appTransId, String appUser, long appTime,
                                            long amount, String description,
                                            String embedData, String item) throws Exception {
        String url = zaloPayConfig.getEndpoint() + "/create";

        String mac = zaloPayConfig.createOrderMac(appTransId, appUser, amount, appTime, embedData, item);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("app_id", zaloPayConfig.getAppId());
        params.add("app_user", appUser);
        params.add("app_trans_id", appTransId);
        params.add("app_time", String.valueOf(appTime));
        params.add("amount", String.valueOf(amount));
        params.add("description", description);
        params.add("embed_data", embedData);
        params.add("item", item);
        params.add("bank_code", "");
        params.add("expire_duration_seconds", String.valueOf(PAYMENT_EXPIRY_SECONDS));
        params.add("callback_url", zaloPayConfig.getEndpoint().replace("openapi", "callback"));
        params.add("mac", mac);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        log.debug("ZaloPay create order response: {}", response.getBody());
        return objectMapper.readTree(response.getBody());
    }

    private JsonNode callZaloPayQuery(String appTransId) throws Exception {
        String url = zaloPayConfig.getEndpoint() + "/query";

        String mac = zaloPayConfig.createQueryMac(appTransId);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("app_id", zaloPayConfig.getAppId());
        params.add("app_trans_id", appTransId);
        params.add("mac", mac);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        log.debug("ZaloPay query response: {}", response.getBody());
        return objectMapper.readTree(response.getBody());
    }

    private String generateAppTransId(Long userId) {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        int random = ThreadLocalRandom.current().nextInt(100000, 999999);
        return datePrefix + "_BAL_" + userId + "_" + random;
    }

    private BalanceDepositResponse buildDepositResponse(BalanceDeposit deposit) {
        return BalanceDepositResponse.builder()
                .id(deposit.getId())
                .appTransId(deposit.getAppTransId())
                .zpTransId(deposit.getZpTransId())
                .userId(deposit.getUser().getId())
                .userFullName(deposit.getUser().getFullName())
                .amount(deposit.getAmount())
                .description(deposit.getDescription())
                .orderUrl(deposit.getOrderUrl())
                .qrCode(deposit.getQrCode())
                .zpTransToken(deposit.getZpTransToken())
                .status(deposit.getStatus())
                .paymentChannel(deposit.getPaymentChannel())
                .expiredAt(deposit.getExpiredAt())
                .paidAt(deposit.getPaidAt())
                .createdAt(deposit.getCreatedAt())
                .build();
    }
}
