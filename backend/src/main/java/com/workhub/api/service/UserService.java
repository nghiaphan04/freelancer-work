package com.workhub.api.service;

import com.workhub.api.dto.request.ChangePasswordRequest;
import com.workhub.api.dto.request.UpdateProfileRequest;
import com.workhub.api.entity.ERole;
import com.workhub.api.entity.Role;
import com.workhub.api.entity.User;
import com.workhub.api.exception.UserNotFoundException;
import com.workhub.api.repository.RoleRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy user: " + email));
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy user: " + id));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest req) {
        User user = getById(userId);
        user.updateProfile(
                req.getFullName(),
                req.getPhoneNumber(),
                req.getAvatarUrl(),
                req.getCoverImageUrl(),
                req.getTitle(),
                req.getLocation(),
                req.getCompany(),
                req.getBio(),
                req.getSkills(),
                req.getIsOpenToWork(),
                req.getOpenToWorkRoles(),
                req.getBankAccountNumber(),
                req.getBankName()
        );
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = getById(userId);

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        if (passwordEncoder.matches(req.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng mật khẩu cũ");
        }

        user.changePassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public User updateUserStatus(Long userId, Boolean enabled) {
        User user = getById(userId);
        if (enabled) {
            user.enable();
        } else {
            user.disable();
        }
        return userRepository.save(user);
    }

    @Transactional
    public User addEmployerRole(Long userId) {
        User user = getById(userId);
        
        if (user.hasRole(ERole.ROLE_EMPLOYER)) {
            throw new IllegalArgumentException("Bạn đã có quyền đăng việc");
        }
        
        Role employerRole = roleRepository.findByName(ERole.ROLE_EMPLOYER)
                .orElseThrow(() -> new RuntimeException("Role EMPLOYER không tồn tại"));
        
        user.assignRole(employerRole);
        return userRepository.save(user);
    }

    @Transactional
    public User grantCredits(Long userId, int amount) {
        User user = getById(userId);
        user.addCredits(amount);
        return userRepository.save(user);
    }

    @Transactional
    public boolean claimDailyCredits(Long userId) {
        User user = getById(userId);
        boolean claimed = user.claimDailyCredits();
        if (claimed) {
            userRepository.save(user);
        }
        return claimed;
    }
}
