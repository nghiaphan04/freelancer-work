package com.workhub.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workhub.api.config.ZaloPayConfig;
import com.workhub.api.dto.request.ZaloPayCallbackRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.PaymentResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.JobNotFoundException;
import com.workhub.api.repository.JobRepository;
import com.workhub.api.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final JobRepository jobRepository;
    private final UserService userService;
    private final ZaloPayConfig zaloPayConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final BigDecimal FEE_PERCENT = new BigDecimal("5.00");
    private static final int PAYMENT_EXPIRY_SECONDS = 900; // 15 phút

    @Transactional
    public ApiResponse<PaymentResponse> createPaymentForJob(Long jobId, Long userId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));

        if (!job.isOwnedBy(userId)) {
            throw new RuntimeException("Bạn không có quyền thanh toán cho job này");
        }

        if (job.getBudget() == null || job.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Job chưa có ngân sách");
        }

        if (paymentRepository.existsByJobIdAndStatus(jobId, EPaymentStatus.PAID)) {
            throw new RuntimeException("Job đã được thanh toán");
        }

        User user = userService.getById(userId);

        BigDecimal jobAmount = job.getBudget();
        BigDecimal feeAmount = jobAmount.multiply(FEE_PERCENT).divide(new BigDecimal("100"), 0, RoundingMode.CEILING);
        BigDecimal totalAmount = jobAmount.add(feeAmount);

        String appTransId = generateAppTransId(jobId);
        long appTime = System.currentTimeMillis();
        String description = "WorkHub - Thanh toan job #" + jobId;

        String embedData = String.format("{\"redirecturl\":\"%s\",\"jobId\":%d}", 
                zaloPayConfig.getReturnUrl(), jobId);
        String item = "[]";

        Payment payment = Payment.builder()
                .appTransId(appTransId)
                .job(job)
                .user(user)
                .jobAmount(jobAmount)
                .feeAmount(feeAmount)
                .feePercent(FEE_PERCENT)
                .totalAmount(totalAmount)
                .currency("VND")
                .description(description)
                .status(EPaymentStatus.PENDING)
                .expiredAt(LocalDateTime.now().plusSeconds(PAYMENT_EXPIRY_SECONDS))
                .build();

        try {
            JsonNode zaloPayResponse = callZaloPayCreateOrder(
                    appTransId,
                    user.getFullName(),
                    appTime,
                    totalAmount.longValue(),
                    description,
                    embedData,
                    item
            );

            int returnCode = zaloPayResponse.get("return_code").asInt();
            if (returnCode == 1) {
                // Thành công
                String orderUrl = zaloPayResponse.has("order_url") ? 
                        zaloPayResponse.get("order_url").asText() : null;
                String qrCode = zaloPayResponse.has("qr_code") ? 
                        zaloPayResponse.get("qr_code").asText() : null;
                String zpTransToken = zaloPayResponse.has("zp_trans_token") ? 
                        zaloPayResponse.get("zp_trans_token").asText() : null;

                payment.setZaloPayInfo(orderUrl, qrCode, zpTransToken);
            } else {
                // Thất bại
                String returnMessage = zaloPayResponse.get("return_message").asText();
                String subReturnMessage = zaloPayResponse.has("sub_return_message") ? 
                        zaloPayResponse.get("sub_return_message").asText() : "";
                throw new RuntimeException("ZaloPay error: " + returnMessage + " - " + subReturnMessage);
            }

        } catch (Exception e) {
            log.error("Lỗi gọi ZaloPay API", e);
            throw new RuntimeException("Lỗi tạo đơn hàng thanh toán: " + e.getMessage());
        }

        Payment savedPayment = paymentRepository.save(payment);
        return ApiResponse.success("Tạo đơn hàng thanh toán thành công", buildPaymentResponse(savedPayment));
    }

    @Transactional
    public Map<String, Object> handleCallback(ZaloPayCallbackRequest request) {
        Map<String, Object> result = new HashMap<>();

        try {
            String dataStr = request.getData();
            String requestMac = request.getMac();

            if (!zaloPayConfig.verifyCallback(dataStr, requestMac)) {
                log.warn("Callback không hợp lệ - MAC không khớp");
                result.put("return_code", -1);
                result.put("return_message", "mac not equal");
                return result;
            }

            ZaloPayCallbackRequest.CallbackData callbackData = 
                    objectMapper.readValue(dataStr, ZaloPayCallbackRequest.CallbackData.class);

            String appTransId = callbackData.getAppTransId();
            log.info("Nhận callback từ ZaloPay: appTransId={}, zpTransId={}", 
                    appTransId, callbackData.getZpTransId());

            Payment payment = paymentRepository.findByAppTransId(appTransId).orElse(null);

            if (payment == null) {
                log.warn("Không tìm thấy payment với appTransId: {}", appTransId);
                result.put("return_code", 1);
                result.put("return_message", "success");
                return result;
            }

            if (payment.isPaid()) {
                log.info("Payment đã được xử lý trước đó: {}", appTransId);
                result.put("return_code", 2);
                result.put("return_message", "duplicate");
                return result;
            }

            payment.markAsPaid(callbackData.getZpTransId(), callbackData.getChannel());
            paymentRepository.save(payment);

            Job job = payment.getJob();
            job.publish();
            jobRepository.save(job);

            log.info("Thanh toán thành công: appTransId={}, jobId={}, channel={}", 
                    appTransId, job.getId(), callbackData.getChannel());

            result.put("return_code", 1);
            result.put("return_message", "success");

        } catch (Exception e) {
            log.error("Lỗi xử lý callback", e);
            result.put("return_code", 0);
            result.put("return_message", e.getMessage());
        }

        return result;
    }

    public ApiResponse<PaymentResponse> queryPaymentStatus(String appTransId, Long userId) {
        Payment payment = paymentRepository.findByAppTransId(appTransId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thanh toán"));

        if (!payment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem thanh toán này");
        }

        if (payment.isPending()) {
            try {
                JsonNode queryResult = callZaloPayQuery(appTransId);
                int returnCode = queryResult.get("return_code").asInt();

                if (returnCode == 1) {
                    Long zpTransId = queryResult.has("zp_trans_id") ? 
                            queryResult.get("zp_trans_id").asLong() : null;
                    payment.markAsPaid(zpTransId, null);
                    
                    Job job = payment.getJob();
                    job.publish();
                    jobRepository.save(job);
                    
                    payment = paymentRepository.save(payment);
                    log.info("Cập nhật trạng thái từ query: appTransId={}, status=PAID", appTransId);
                } else if (returnCode == 2) {
                    payment.markAsCancelled();
                    payment = paymentRepository.save(payment);
                }
                
            } catch (Exception e) {
                log.error("Lỗi query ZaloPay", e);
            }
        }

        return ApiResponse.success("Thành công", buildPaymentResponse(payment));
    }

    public ApiResponse<PaymentResponse> getPaymentByJobId(Long jobId, Long userId) {
        Payment payment = paymentRepository.findByJobId(jobId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thanh toán cho job này"));
        
        if (!payment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem thanh toán này");
        }
        
        return ApiResponse.success("Thành công", buildPaymentResponse(payment));
    }

    public ApiResponse<Page<PaymentResponse>> getMyPayments(Long userId, EPaymentStatus status,
                                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<Payment> payments;
        if (status != null) {
            payments = paymentRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            payments = paymentRepository.findByUserId(userId, pageable);
        }
        
        Page<PaymentResponse> response = payments.map(this::buildPaymentResponse);
        return ApiResponse.success("Thành công", response);
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
        params.add("callback_url", zaloPayConfig.getEndpoint().replace("openapi", "callback")); // Sẽ override bằng callback đã đăng ký
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

    private String generateAppTransId(Long jobId) {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        int random = ThreadLocalRandom.current().nextInt(100000, 999999);
        return datePrefix + "_" + jobId + "_" + random;
    }

    private PaymentResponse buildPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .appTransId(payment.getAppTransId())
                .zpTransId(payment.getZpTransId())
                .jobId(payment.getJob().getId())
                .jobTitle(payment.getJob().getTitle())
                .jobAmount(payment.getJobAmount())
                .feeAmount(payment.getFeeAmount())
                .feePercent(payment.getFeePercent())
                .totalAmount(payment.getTotalAmount())
                .currency(payment.getCurrency())
                .description(payment.getDescription())
                .orderUrl(payment.getOrderUrl())
                .qrCode(payment.getQrCode())
                .status(payment.getStatus())
                .paymentChannel(payment.getPaymentChannel())
                .expiredAt(payment.getExpiredAt())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
