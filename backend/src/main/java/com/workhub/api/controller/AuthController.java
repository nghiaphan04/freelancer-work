package com.workhub.api.controller;

import com.workhub.api.dto.request.*;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.AuthResponse;
import com.workhub.api.dto.response.OtpResponse;
import com.workhub.api.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    
    @Value("${app.jwt.expiration}")
    private long accessTokenExpiry;
    
    @Value("${app.jwt.refresh-expiration}")
    private long refreshTokenExpiry;
    
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;
    
    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;
    
    private void setTokenCookies(HttpServletResponse response, AuthResponse auth) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("accessToken", auth.getAccessToken())
                .httpOnly(true).secure(cookieSecure).path("/").maxAge(accessTokenExpiry / 1000).sameSite(cookieSameSite).build().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("refreshToken", auth.getRefreshToken())
                .httpOnly(true).secure(cookieSecure).path("/api/auth").maxAge(refreshTokenExpiry / 1000).sameSite(cookieSameSite).build().toString());
    }
    
    private void clearTokenCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("accessToken", "").httpOnly(true).secure(cookieSecure).path("/").maxAge(0).sameSite(cookieSameSite).build().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("refreshToken", "").httpOnly(true).secure(cookieSecure).path("/api/auth").maxAge(0).sameSite(cookieSameSite).build().toString());
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<OtpResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest req, HttpServletResponse response) {
        ApiResponse<AuthResponse> result = authService.verifyOtp(req);
        if (result.getData() != null) setTokenCookies(response, result.getData());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<OtpResponse>> resendOtp(@Valid @RequestBody ResendOtpRequest req) {
        return ResponseEntity.ok(authService.resendOtp(req));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        ApiResponse<AuthResponse> result = authService.login(req);
        if (result.getData() != null) setTokenCookies(response, result.getData());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@CookieValue(name = "refreshToken", required = false) String cookieToken,
                                                                   @RequestBody(required = false) RefreshTokenRequest req, HttpServletResponse response) {
        String token = cookieToken != null ? cookieToken : (req != null ? req.getRefreshToken() : null);
        ApiResponse<AuthResponse> result = authService.refreshToken(new RefreshTokenRequest(token));
        if (result.getData() != null) setTokenCookies(response, result.getData());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@CookieValue(name = "refreshToken", required = false) String cookieToken,
                                                     @RequestBody(required = false) RefreshTokenRequest req, HttpServletResponse response) {
        String token = cookieToken != null ? cookieToken : (req != null ? req.getRefreshToken() : null);
        clearTokenCookies(response);
        return ResponseEntity.ok(authService.logout(token));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<OtpResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return ResponseEntity.ok(authService.forgotPassword(req));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(authService.resetPassword(req));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(
            @Valid @RequestBody GoogleAuthRequest req,
            HttpServletResponse response) {
        ApiResponse<AuthResponse> result = authService.googleAuth(req);
        if (result.getData() != null) {
            setTokenCookies(response, result.getData());
        }
        return ResponseEntity.ok(result);
    }
}
