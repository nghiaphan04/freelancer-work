package com.workhub.api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.concurrent.TimeUnit;

@Configuration
@RequiredArgsConstructor
public class RateLimitConfig {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.rate-limit.register.capacity}")
    private int registerCapacity;

    @Value("${app.rate-limit.register.refill-duration}")
    private long registerRefillDuration;

    @Value("${app.rate-limit.login.capacity}")
    private int loginCapacity;

    @Value("${app.rate-limit.login.refill-duration}")
    private long loginRefillDuration;

    public boolean isAllowed(String key, int limit, long windowSeconds) {
        String redisKey = "rate:" + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);

        if (count != null && count == 1) {
            redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        }

        return count != null && count <= limit;
    }

    public long getRetryAfter(String key) {
        String redisKey = "rate:" + key;
        Long ttl = redisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    public boolean isRegisterAllowed(String ip) {
        return isAllowed("register:" + ip, registerCapacity, registerRefillDuration);
    }

    public boolean isLoginAllowed(String ip) {
        return isAllowed("login:" + ip, loginCapacity, loginRefillDuration);
    }

    public boolean isOtpAllowed(String ip) {
        return isAllowed("otp:" + ip, 5, 600); // 5 attempts per 10 minutes
    }

    public boolean isForgotPasswordAllowed(String ip) {
        return isAllowed("forgot:" + ip, 3, 3600); // 3 attempts per hour
    }

    public long getRegisterRetryAfter(String ip) {
        return getRetryAfter("register:" + ip);
    }

    public long getLoginRetryAfter(String ip) {
        return getRetryAfter("login:" + ip);
    }

    public long getOtpRetryAfter(String ip) {
        return getRetryAfter("otp:" + ip);
    }

    public long getForgotPasswordRetryAfter(String ip) {
        return getRetryAfter("forgot:" + ip);
    }
}
