package com.workhub.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String accessToken;
    private String refreshToken;
    
    @Builder.Default
    private String tokenType = "Bearer";
    
    private Long expiresIn;
    private UserResponse user;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserResponse {
        private Long id;
        private String email;
        private String fullName;
        private String phoneNumber;
        private String avatarUrl;
        private String coverImageUrl;
        private String title;
        private String location;
        private String company;
        private String bio;
        private Set<String> skills;
        private Boolean isVerified;
        private Boolean isOpenToWork;
        private Set<String> openToWorkRoles;
        private Boolean emailVerified;
        private Boolean enabled;
        private List<String> roles;
        private Integer credits;
        private BigDecimal balance;
        private String bankAccountNumber;  // private - chỉ admin và chính user thấy
        private String bankName;           // private - chỉ admin và chính user thấy
        private Boolean hasBankInfo;       // public - cho biết đã có thông tin ngân hàng chưa
    }
}
