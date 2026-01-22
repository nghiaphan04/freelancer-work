package com.workhub.api.controller;

import com.workhub.api.dto.request.ChangePasswordRequest;
import com.workhub.api.dto.request.UpdateProfileRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.AuthResponse;
import com.workhub.api.entity.User;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> getMe(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User user = userService.getById(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Thành công", buildUserResponse(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateProfileRequest req) {

        User user = userService.updateProfile(userDetails.getId(), req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật profile thành công", buildUserResponse(user)));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ChangePasswordRequest req) {

        userService.changePassword(userDetails.getId(), req);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }

    @PostMapping("/me/become-employer")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> becomeEmployer(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User user = userService.addEmployerRole(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công! Bạn có thể đăng việc.", buildUserResponse(user)));
    }

    @PutMapping("/me/wallet")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> updateWalletAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String walletAddress) {

        User user = userService.getById(userDetails.getId());
        user.setWalletAddress(walletAddress);
        user = userService.save(user);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu địa chỉ ví", buildUserResponse(user)));
    }

    @GetMapping("/me/wallet")
    public ResponseEntity<ApiResponse<String>> getWalletAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User user = userService.getById(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Thành công", user.getWalletAddress()));
    }

    private AuthResponse.UserResponse buildUserResponse(User user) {
        return buildUserResponse(user, true);
    }

    private AuthResponse.UserResponse buildUserResponse(User user, boolean includeBankInfo) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        AuthResponse.UserResponse.UserResponseBuilder builder = AuthResponse.UserResponse.builder()
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
                .roles(roles)
                .hasBankInfo(user.hasBankInfo())
                .walletAddress(user.getWalletAddress());

        if (includeBankInfo) {
            builder.bankAccountNumber(user.getBankAccountNumber())
                   .bankName(user.getBankName());
        }

        return builder.build();
    }
}
