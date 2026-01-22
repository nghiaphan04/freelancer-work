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
    
    // 4 extra admins (total 5 with main admin) for multi-round voting
    private static final String[][] EXTRA_ADMINS = {
        {"admin2@gmail.com", "Admin 02"},
        {"admin3@gmail.com", "Admin 03"},
        {"admin4@gmail.com", "Admin 04"},
        {"admin5@gmail.com", "Admin 05"},
    };
    
    @Override
    public void run(String... args) {
        logger.info("Starting Admin Seeder...");
        
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin role not found. Please run RoleSeeder first."));
        
        // Create main admin
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .emailVerified(true)
                    .enabled(true)
                    .build();
            
            admin.assignRole(adminRole);
            userRepository.save(admin);
            logger.info("Admin user created: {}", adminEmail);
        } else {
            logger.info("Admin user already exists: {}", adminEmail);
        }
        
        // Create extra admins for multi-round voting
        for (String[] adminData : EXTRA_ADMINS) {
            String email = adminData[0];
            String fullName = adminData[1];
            
            if (!userRepository.existsByEmail(email)) {
                User extraAdmin = User.builder()
                        .email(email)
                        .password(passwordEncoder.encode(adminPassword))
                        .fullName(fullName)
                        .emailVerified(true)
                        .enabled(true)
                        .build();
                
                extraAdmin.assignRole(adminRole);
                userRepository.save(extraAdmin);
                logger.info("Extra admin created: {} - {}", email, fullName);
            } else {
                logger.info("Extra admin already exists: {}", email);
            }
        }
        
        long adminCount = userRepository.countByRole(ERole.ROLE_ADMIN);
        logger.info("Admin Seeder completed. Total admins: {}", adminCount);
    }
}
