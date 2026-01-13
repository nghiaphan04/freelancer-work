package com.workhub.api.seeder;

import com.workhub.api.entity.ERole;
import com.workhub.api.entity.Role;
import com.workhub.api.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

@Component
@Order(1)
@RequiredArgsConstructor
public class RoleSeeder implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(RoleSeeder.class);
    
    private final RoleRepository roleRepository;
    
    @Override
    @Transactional
    public void run(String... args) {
        logger.info("Starting Role Seeder...");
        
        Arrays.stream(ERole.values()).forEach(this::createRoleIfNotExists);
        
        logger.info("Role Seeder completed.");
    }
    
    private void createRoleIfNotExists(ERole eRole) {
        try {
            if (!roleRepository.existsByName(eRole)) {
                Role role = new Role(eRole);
                roleRepository.saveAndFlush(role);
                logger.info("Created role: {}", eRole.name());
            } else {
                logger.info("Role already exists: {}", eRole.name());
            }
        } catch (DataIntegrityViolationException e) {
        }
    }
}
