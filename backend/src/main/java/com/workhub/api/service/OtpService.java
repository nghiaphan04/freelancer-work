package com.workhub.api.service;

import com.workhub.api.entity.EOtpType;
import com.workhub.api.entity.User;
import com.workhub.api.exception.InvalidOtpException;
import com.workhub.api.exception.OtpExpiredException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final EmailService emailService;

    @Value("${app.otp.expiration}")
    private long otpExpiration; // milliseconds

    @Value("${app.otp.max-attempts}")
    private int maxAttempts;

    private static final SecureRandom random = new SecureRandom();

    public void generateAndSendOtp(User user, EOtpType otpType) {
        String otpKey = "otp:" + otpType + ":" + user.getEmail();
        String attemptsKey = "otp_attempts:" + otpType + ":" + user.getEmail();

        // Xóa OTP cũ
        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);

        // Tạo OTP mới
        String otpCode = String.format("%06d", random.nextInt(1000000));
        long ttlSeconds = otpExpiration / 1000;

        // Lưu vào Redis
        redisTemplate.opsForValue().set(otpKey, otpCode, ttlSeconds, TimeUnit.SECONDS);

        // Gửi email
        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otpCode, otpType.name());
    }

    public void verifyOtp(String email, String otpCode, EOtpType otpType) {
        String otpKey = "otp:" + otpType + ":" + email;
        String attemptsKey = "otp_attempts:" + otpType + ":" + email;

        // Kiểm tra OTP tồn tại
        String storedOtp = (String) redisTemplate.opsForValue().get(otpKey);
        if (storedOtp == null) {
            throw new OtpExpiredException("OTP hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // Kiểm tra số lần thử
        Integer attempts = (Integer) redisTemplate.opsForValue().get(attemptsKey);
        if (attempts != null && attempts >= maxAttempts) {
            redisTemplate.delete(otpKey);
            redisTemplate.delete(attemptsKey);
            throw new InvalidOtpException("Quá số lần thử. Vui lòng yêu cầu mã mới.");
        }

        // Tăng số lần thử
        redisTemplate.opsForValue().increment(attemptsKey);
        redisTemplate.expire(attemptsKey, otpExpiration / 1000, TimeUnit.SECONDS);

        // Kiểm tra OTP
        if (!storedOtp.equals(otpCode)) {
            int remaining = maxAttempts - (attempts == null ? 1 : attempts + 1);
            throw new InvalidOtpException("OTP sai. Còn " + remaining + " lần thử.");
        }

        // Xóa OTP sau khi verify thành công
        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);
    }

    public void deleteOtp(String email, EOtpType otpType) {
        redisTemplate.delete("otp:" + otpType + ":" + email);
        redisTemplate.delete("otp_attempts:" + otpType + ":" + email);
    }

    public long getOtpExpirationSeconds() {
        return otpExpiration / 1000;
    }
}
