package com.workhub.api.repository;

import com.workhub.api.entity.ERole;
import com.workhub.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.walletAddress) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND NOT EXISTS (SELECT 1 FROM u.roles r WHERE r.name = com.workhub.api.entity.ERole.ROLE_ADMIN)")
    List<User> searchByNameOrWalletExcludeAdmin(@Param("keyword") String keyword);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :role")
    List<User> findByRole(@Param("role") ERole role);
    
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :role")
    long countByRole(@Param("role") ERole role);
    
    Optional<User> findByWalletAddress(String walletAddress);
    
    boolean existsByWalletAddress(String walletAddress);
}
