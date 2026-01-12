package com.workhub.api.repository;

import com.workhub.api.entity.EPaymentStatus;
import com.workhub.api.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAppTransId(String appTransId);

    Optional<Payment> findByZpTransId(Long zpTransId);

    Optional<Payment> findByJobId(Long jobId);

    Optional<Payment> findByJobIdAndStatus(Long jobId, EPaymentStatus status);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    Page<Payment> findByUserIdAndStatus(Long userId, EPaymentStatus status, Pageable pageable);

    boolean existsByJobIdAndStatus(Long jobId, EPaymentStatus status);
}
