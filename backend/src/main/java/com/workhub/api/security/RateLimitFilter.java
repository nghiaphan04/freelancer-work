package com.workhub.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workhub.api.config.RateLimitConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if (!path.startsWith("/api/auth") || !"POST".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIP = getClientIP(request);
        boolean allowed = true;
        long retryAfter = 0;

        if (path.equals("/api/auth/register")) {
            allowed = rateLimitConfig.isRegisterAllowed(clientIP);
            retryAfter = rateLimitConfig.getRegisterRetryAfter(clientIP);
        } else if (path.equals("/api/auth/login")) {
            allowed = rateLimitConfig.isLoginAllowed(clientIP);
            retryAfter = rateLimitConfig.getLoginRetryAfter(clientIP);
        } else if (path.equals("/api/auth/verify-otp") || path.equals("/api/auth/resend-otp")) {
            allowed = rateLimitConfig.isOtpAllowed(clientIP);
            retryAfter = rateLimitConfig.getOtpRetryAfter(clientIP);
        } else if (path.equals("/api/auth/forgot-password") || path.equals("/api/auth/reset-password")) {
            allowed = rateLimitConfig.isForgotPasswordAllowed(clientIP);
            retryAfter = rateLimitConfig.getForgotPasswordRetryAfter(clientIP);
        }

        if (!allowed) {
            sendRateLimitResponse(response, retryAfter);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

        Map<String, Object> body = new HashMap<>();
        body.put("status", "ERROR");
        body.put("message", "Too many requests. Try again in " + retryAfterSeconds + "s");
        body.put("retryAfter", retryAfterSeconds);

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
