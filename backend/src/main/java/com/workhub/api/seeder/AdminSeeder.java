package com.workhub.api.seeder;

import com.workhub.api.entity.ERole;
import com.workhub.api.entity.Role;
import com.workhub.api.entity.User;
import com.workhub.api.repository.RoleRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminSeeder.class);
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.admin.email}")
    private String adminEmail;
    
    @Value("${app.admin.password}")
    private String adminPassword;
    
    @Value("${app.admin.full-name}")
    private String adminFullName;
    
    @Override
    public void run(String... args) {
        logger.info("Starting Admin Seeder...");
        
        if (userRepository.existsByEmail(adminEmail)) {
            logger.info("Admin user already exists: {}", adminEmail);
            return;
        }
        
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin role not found. Please run RoleSeeder first."));
        
        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .fullName(adminFullName)
                .emailVerified(true)
                .enabled(true)
                .build();
        
        admin.assignRole(adminRole);
        
        userRepository.save(admin);
        logger.info("Admin user created successfully: {}", adminEmail);
        
        logger.info("Admin Seeder completed.");
    }
}
