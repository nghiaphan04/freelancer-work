package com.workhub.api.service;

import com.workhub.api.dto.request.*;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.AuthResponse;
import com.workhub.api.dto.response.OtpResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.EmailNotVerifiedException;
import com.workhub.api.exception.UserAlreadyExistsException;
import com.workhub.api.exception.UserNotFoundException;
import com.workhub.api.repository.RoleRepository;
import com.workhub.api.security.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final RoleRepository roleRepository;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Transactional
    public ApiResponse<OtpResponse> register(RegisterRequest req) {
        if (userService.existsByEmail(req.getEmail())) {
            throw new UserAlreadyExistsException("Email đã được đăng ký");
        }

        Role role = roleRepository.findByName(ERole.ROLE_FREELANCER)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại"));

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .emailVerified(false)
                .enabled(true)
                .build();
        user.assignRole(role);

        userService.save(user);
        otpService.generateAndSendOtp(user, EOtpType.REGISTRATION);

        return ApiResponse.success("Đăng ký thành công. Vui lòng xác thực email.",
                new OtpResponse(user.getEmail(), otpService.getOtpExpirationSeconds()));
    }

    @Transactional
    public ApiResponse<AuthResponse> verifyOtp(VerifyOtpRequest req) {
        otpService.verifyOtp(req.getEmail(), req.getOtp(), EOtpType.REGISTRATION);

        User user = userService.getByEmail(req.getEmail());
        user.verifyEmail();
        userService.save(user);

        return buildAuthResponse(user, "Xác thực email thành công");
    }

    public ApiResponse<AuthResponse> login(LoginRequest req) {
        User user = userService.findByEmail(req.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Email không tồn tại"));

        if (!user.getEmailVerified()) {
            otpService.generateAndSendOtp(user, EOtpType.REGISTRATION);
            throw new EmailNotVerifiedException("Email chưa xác thực. Đã gửi OTP mới.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        return buildAuthResponse(user, "Đăng nhập thành công");
    }

    public ApiResponse<AuthResponse> refreshToken(RefreshTokenRequest req) {
        RefreshToken token = refreshTokenService.verifyToken(req.getRefreshToken());
        return buildAuthResponse(token.getUser(), "Token đã được làm mới");
    }

    public ApiResponse<Void> logout(String refreshToken) {
        refreshTokenService.deleteByToken(refreshToken);
        SecurityContextHolder.clearContext();
        return ApiResponse.success("Đăng xuất thành công");
    }

    public ApiResponse<OtpResponse> forgotPassword(ForgotPasswordRequest req) {
        User user = userService.findByEmail(req.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Email không tồn tại"));

        otpService.generateAndSendOtp(user, EOtpType.FORGOT_PASSWORD);

        return ApiResponse.success("Đã gửi OTP đến email",
                new OtpResponse(user.getEmail(), otpService.getOtpExpirationSeconds()));
    }

    @Transactional
    public ApiResponse<Void> resetPassword(ResetPasswordRequest req) {
        otpService.verifyOtp(req.getEmail(), req.getOtp(), EOtpType.FORGOT_PASSWORD);

        User user = userService.getByEmail(req.getEmail());
        user.changePassword(passwordEncoder.encode(req.getNewPassword()));
        userService.save(user);

        refreshTokenService.deleteByUser(user);

        return ApiResponse.success("Đặt lại mật khẩu thành công");
    }

    public ApiResponse<OtpResponse> resendOtp(ResendOtpRequest req) {
        User user = userService.findByEmail(req.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Email không tồn tại"));

        EOtpType otpType = EOtpType.valueOf(req.getOtpType().toUpperCase());
        otpService.generateAndSendOtp(user, otpType);

        return ApiResponse.success("Đã gửi lại OTP",
                new OtpResponse(user.getEmail(), otpService.getOtpExpirationSeconds()));
    }

    private ApiResponse<AuthResponse> buildAuthResponse(User user, String message) {
        String roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.joining(","));

        String accessToken = jwtUtils.generateTokenFromEmail(user.getEmail(), user.getId(), roles);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        List<String> roleList = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        AuthResponse.UserResponse userRes = AuthResponse.UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .emailVerified(user.getEmailVerified())
                .enabled(user.getEnabled())
                .roles(roleList)
                .build();

        AuthResponse authRes = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getJwtExpiration() / 1000)
                .user(userRes)
                .build();

        return ApiResponse.success(message, authRes);
    }
}
