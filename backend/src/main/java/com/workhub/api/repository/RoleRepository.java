package com.workhub.api.repository;

import com.workhub.api.entity.ERole;
import com.workhub.api.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    
    Optional<Role> findByName(ERole name);
    
    boolean existsByName(ERole name);
}
