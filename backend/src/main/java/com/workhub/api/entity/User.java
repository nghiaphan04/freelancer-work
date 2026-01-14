package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email")
        })
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    
    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;
    
    @Column(length = 200)
    private String title;
    
    @Column(length = 100)
    private String location;
    
    @Column(length = 200)
    private String company;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill", length = 100)
    @Builder.Default
    private Set<String> skills = new HashSet<>();
    
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;
    
    @Column(name = "is_open_to_work", nullable = false)
    @Builder.Default
    private Boolean isOpenToWork = false;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_open_to_work_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", length = 100)
    @Builder.Default
    private Set<String> openToWorkRoles = new HashSet<>();
    
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer credits = 20;  // 10 tạo tài khoản + 10 daily

    @Column(name = "balance", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "last_daily_credit_date")
    private LocalDate lastDailyCreditDate;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "trust_score", nullable = false)
    @Builder.Default
    private Integer trustScore = 0;

    @Column(name = "untrust_score", nullable = false)
    @Builder.Default
    private Integer untrustScore = 0;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();
    
    public void verifyEmail() {
        this.emailVerified = true;
    }
    public void changePassword(String encodedPassword) {
        if (encodedPassword == null || encodedPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        this.password = encodedPassword;
    }
    public void updateProfile(String fullName, String phoneNumber, String avatarUrl,
                              String coverImageUrl, String title, String location,
                              String company, String bio, Set<String> skills,
                              Boolean isOpenToWork, Set<String> openToWorkRoles,
                              String bankAccountNumber, String bankName) {
        if (fullName != null && !fullName.isBlank()) {
            this.fullName = fullName;
        }
        this.phoneNumber = phoneNumber;
        if (avatarUrl != null) {
            this.avatarUrl = avatarUrl;
        }
        if (coverImageUrl != null) {
            this.coverImageUrl = coverImageUrl;
        }
        this.title = title;
        this.location = location;
        this.company = company;
        this.bio = bio;
        if (skills != null) {
            this.skills = skills;
        }
        if (isOpenToWork != null) {
            this.isOpenToWork = isOpenToWork;
        }
        if (openToWorkRoles != null) {
            this.openToWorkRoles = openToWorkRoles;
        }
        this.bankAccountNumber = bankAccountNumber;
        this.bankName = bankName;
    }
    
    public void verify() {
        this.isVerified = true;
    }
    public void disable() {
        this.enabled = false;
    }
    public void enable() {
        this.enabled = true;
    }
    public void assignRole(Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Role cannot be null");
        }
        this.roles.add(role);
    }
    public void removeRole(Role role) {
        this.roles.remove(role);
    }
    public boolean hasRole(ERole roleName) {
        return this.roles.stream()
                .anyMatch(role -> role.getName() == roleName);
    }
    
    public boolean canLogin() {
        return this.enabled && this.emailVerified;
    }
    
    public boolean isAdmin() {
        return hasRole(ERole.ROLE_ADMIN);
    }

    public boolean hasEnoughCredits(int amount) {
        return this.credits >= amount;
    }

    public void deductCredits(int amount) {
        if (!hasEnoughCredits(amount)) {
            throw new IllegalStateException("Không đủ credit");
        }
        this.credits -= amount;
    }

    public void addCredits(int amount) {
        this.credits += amount;
    }

    public boolean hasEnoughBalance(BigDecimal amount) {
        return this.balance.compareTo(amount) >= 0;
    }

    public void deductBalance(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }
        if (!hasEnoughBalance(amount)) {
            throw new IllegalStateException("Không đủ số dư");
        }
        this.balance = this.balance.subtract(amount);
    }

    public void addBalance(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }
        this.balance = this.balance.add(amount);
    }

    public boolean claimDailyCredits() {
        LocalDate today = LocalDate.now();
        if (this.lastDailyCreditDate == null || !this.lastDailyCreditDate.equals(today)) {
            this.credits += 10;
            this.lastDailyCreditDate = today;
            return true;
        }
        return false;
    }

    public boolean hasBankInfo() {
        return this.bankAccountNumber != null && !this.bankAccountNumber.isBlank()
                && this.bankName != null && !this.bankName.isBlank();
    }

    public void addTrustScore(int amount) {
        this.trustScore += amount;
    }

    public void deductTrustScore(int amount) {
        this.trustScore = Math.max(0, this.trustScore - amount);
    }

    public void addUntrustScore(int amount) {
        this.untrustScore += amount;
    }

    public void updateLastActive() {
        this.lastActiveAt = LocalDateTime.now();
    }
}
