package com.workhub.api.controller;

import com.workhub.api.dto.request.ChangePasswordRequest;
import com.workhub.api.dto.request.GrantCreditsRequest;
import com.workhub.api.dto.request.UpdateProfileRequest;
import com.workhub.api.dto.request.UpdateUserStatusRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.AuthResponse;
import com.workhub.api.entity.User;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuthResponse.UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> users = userService.getAllUsers(pageable);
        Page<AuthResponse.UserResponse> response = users.map(this::buildUserResponse);

        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> getUserById(@PathVariable Long id) {
        User user = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công", buildUserResponse(user)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest req) {

        User user = userService.updateUserStatus(id, req.getEnabled());
        String message = req.getEnabled() ? "Đã kích hoạt user" : "Đã vô hiệu hóa user";
        return ResponseEntity.ok(ApiResponse.success(message, buildUserResponse(user)));
    }

    @PostMapping("/me/become-employer")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> becomeEmployer(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User user = userService.addEmployerRole(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công! Bạn có thể đăng việc.", buildUserResponse(user)));
    }

    @PostMapping("/{id}/credits")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> grantCredits(
            @PathVariable Long id,
            @Valid @RequestBody GrantCreditsRequest req) {

        User user = userService.grantCredits(id, req.getAmount());
        return ResponseEntity.ok(ApiResponse.success(
                "Đã cấp " + req.getAmount() + " credit cho user (tổng: " + user.getCredits() + ")", 
                buildUserResponse(user)));
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
                .credits(user.getCredits())
                .hasBankInfo(user.hasBankInfo());

        if (includeBankInfo) {
            builder.bankAccountNumber(user.getBankAccountNumber())
                   .bankName(user.getBankName());
        }

        return builder.build();
    }
}
