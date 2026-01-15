package com.workhub.api.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
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
    
    @Value("${app.google.client-id}")
    private String googleClientId;
    
    @Value("${app.google.client-secret}")
    private String googleClientSecret;

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

    @Transactional
    public ApiResponse<AuthResponse> login(LoginRequest req) {
        User user = userService.findByEmail(req.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Email không tồn tại"));

        if (!user.getEmailVerified()) {
            otpService.generateAndSendOtp(user, EOtpType.REGISTRATION);
            throw new EmailNotVerifiedException("Email chưa xác thực. Đã gửi OTP mới.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        boolean dailyClaimed = user.claimDailyCredits();
        if (dailyClaimed) {
            userService.save(user);
        }

        String message = dailyClaimed 
                ? "Đăng nhập thành công. Bạn đã nhận 10 credit hôm nay!" 
                : "Đăng nhập thành công";
        return buildAuthResponse(user, message);
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

    @Transactional
    public ApiResponse<AuthResponse> googleAuth(GoogleAuthRequest req) {
        try {
            String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(userInfoUrl))
                    .header("Authorization", "Bearer " + req.getCredential())
                    .GET()
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, 
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return ApiResponse.error("Google token không hợp lệ");
            }

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> userInfo = mapper.readValue(response.body(), 
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});

            String email = (String) userInfo.get("email");
            String fullName = (String) userInfo.get("name");
            String avatarUrl = (String) userInfo.get("picture");

            if (email == null) {
                return ApiResponse.error("Không lấy được email từ Google");
            }

            User user = userService.findByEmail(email)
                    .orElseGet(() -> createGoogleUser(email, fullName, avatarUrl));

            if (!user.getEmailVerified()) {
                user.verifyEmail();
            }

            boolean dailyClaimed = user.claimDailyCredits();
            userService.save(user);

            String message = dailyClaimed 
                    ? "Đăng nhập Google thành công. Bạn đã nhận 10 credit hôm nay!" 
                    : "Đăng nhập Google thành công";
            return buildAuthResponse(user, message);
        } catch (Exception e) {
            log.error("Google auth failed", e);
            return ApiResponse.error("Xác thực Google thất bại");
        }
    }

    private User createGoogleUser(String email, String fullName, String avatarUrl) {
        Role role = roleRepository.findByName(ERole.ROLE_FREELANCER)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại"));

        User user = User.builder()
                .email(email)
                .password("")
                .fullName(fullName != null ? fullName : email.split("@")[0])
                .avatarUrl(avatarUrl)
                .emailVerified(true)
                .enabled(true)
                .build();
        user.assignRole(role);
        return userService.save(user);
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
                .coverImageUrl(user.getCoverImageUrl())
                .title(user.getTitle())
                .location(user.getLocation())
                .company(user.getCompany())
                .bio(user.getBio())
                .skills(user.getSkills())
                .isVerified(user.getIsVerified())
                .isOpenToWork(user.getIsOpenToWork())
                .openToWorkRoles(user.getOpenToWorkRoles())
                .emailVerified(user.getEmailVerified())
                .enabled(user.getEnabled())
                .roles(roleList)
                .credits(user.getCredits())
                .balance(user.getBalance())
                .bankAccountNumber(user.getBankAccountNumber())
                .bankName(user.getBankName())
                .hasBankInfo(user.hasBankInfo())
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
