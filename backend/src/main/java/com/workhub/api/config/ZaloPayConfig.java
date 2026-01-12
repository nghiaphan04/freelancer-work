package com.workhub.api.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Formatter;

@Configuration
@Getter
public class ZaloPayConfig {

    @Value("${zalopay.app-id}")
    private String appId;

    @Value("${zalopay.key1}")
    private String key1;

    @Value("${zalopay.key2}")
    private String key2;

    @Value("${zalopay.endpoint}")
    private String endpoint;

    @Value("${app.payment.return-url}")
    private String returnUrl;


    /**
     * Tạo MAC cho request tạo đơn hàng
     * hmac_input = app_id|app_trans_id|app_user|amount|app_time|embed_data|item
     */
    public String createOrderMac(String appTransId, String appUser, long amount, 
                                  long appTime, String embedData, String item) {
        String data = appId + "|" + appTransId + "|" + appUser + "|" + amount + "|" 
                    + appTime + "|" + embedData + "|" + item;
        return hmacSHA256(key1, data);
    }

    /**
     * Tạo MAC cho request truy vấn đơn hàng
     * hmac_input = app_id|app_trans_id|key1
     */
    public String createQueryMac(String appTransId) {
        String data = appId + "|" + appTransId + "|" + key1;
        return hmacSHA256(key1, data);
    }

    /**
     * Xác thực callback từ ZaloPay
     * mac = HMAC(key2, data)
     */
    public boolean verifyCallback(String data, String requestMac) {
        String calculatedMac = hmacSHA256(key2, data);
        return calculatedMac.equals(requestMac);
    }

    /**
     * Tạo MAC cho request hoàn tiền (không có refund_fee_amount)
     * hmac_input = app_id|zp_trans_id|amount|description|timestamp
     */
    public String createRefundMac(String zpTransId, long amount, String description, long timestamp) {
        String data = appId + "|" + zpTransId + "|" + amount + "|" + description + "|" + timestamp;
        return hmacSHA256(key1, data);
    }

    /**
     * Tạo MAC cho request truy vấn hoàn tiền
     * hmac_input = app_id|m_refund_id|timestamp
     */
    public String createQueryRefundMac(String mRefundId, long timestamp) {
        String data = appId + "|" + mRefundId + "|" + timestamp;
        return hmacSHA256(key1, data);
    }

    /**
     * HMAC SHA256
     */
    private String hmacSHA256(String key, String data) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return toHexString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo HMAC SHA256", e);
        }
    }

    private String toHexString(byte[] bytes) {
        Formatter formatter = new Formatter();
        for (byte b : bytes) {
            formatter.format("%02x", b);
        }
        String result = formatter.toString();
        formatter.close();
        return result;
    }
}
